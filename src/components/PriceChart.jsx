import { useState, useMemo, useRef, useEffect } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    LineElement,
    LineController,
    PointElement,
    Tooltip,
    Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { tocents, getTodayStr, getTomorrowStr, toHourly } from '../hooks/usePrices'

// Custom plugin: vertical "now" line
const nowLinePlugin = {
    id: 'nowLine',
    afterDatasetsDraw(chart) {
        const { index, color = 'rgba(0,0,0,0.2)' } = chart.options.plugins?.nowLine ?? {}
        if (index == null || index < 0) return
        const bar = chart.getDatasetMeta(0).data[index]
        if (!bar) return
        const { ctx, chartArea } = chart
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(bar.x, chartArea.top)
        ctx.lineTo(bar.x, chartArea.bottom)
        ctx.stroke()
        ctx.restore()
    },
}

ChartJS.register(
    CategoryScale, LinearScale,
    BarElement, BarController,
    LineElement, LineController,
    PointElement, Tooltip, Legend, nowLinePlugin
)

const COLORS = {
    dark:  { cheap: '#4ade80', moderate: '#facc15', expensive: '#f87171', tick: '#94a3b8', gridX: '#0f172a', gridY: '#334155', nowLine: 'rgba(255,255,255,0.25)', fixedLine: '#facc15', legendCheap: '#4ade80', legendModerate: '#facc15', legendExpensive: '#f87171' },
    light: { cheap: '#15803d', moderate: '#b45309', expensive: '#b91c1c', tick: '#64748b', gridX: '#f1f5f9', gridY: '#e2e8f0', nowLine: 'rgba(0,0,0,0.18)',      fixedLine: '#b45309', legendCheap: '#15803d', legendModerate: '#b45309', legendExpensive: '#b91c1c' },
}

function getColor(cents, fixedPrice, c) {
    if (cents < fixedPrice) return c.cheap
    if (cents < fixedPrice * 1.4) return c.moderate
    return c.expensive
}

function fmtTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('fi-FI', {
        timeZone: 'Europe/Helsinki',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const MIN_BAR_WIDTH = { '15min': 14, '1hour': 36 }

export default function PriceChart({ data, fixedPrice, theme }) {
    const c = COLORS[theme] ?? COLORS.light
    const [showFixed, setShowFixed] = useState(false)
    const [view, setView] = useState('today')
    const [intervalMode, setIntervalMode] = useState('15min')
    const [containerWidth, setContainerWidth] = useState(800)
    const scrollRef = useRef(null)
    const containerRef = useRef(null)

    const todayStr = getTodayStr()
    const tomorrowStr = getTomorrowStr()

    // Track container width with ResizeObserver
    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver(entries => {
            setContainerWidth(entries[0].contentRect.width)
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    // Mouse drag to scroll
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        let isDown = false
        let startX = 0
        let scrollLeft = 0

        const onMouseDown = e => {
            isDown = true
            startX = e.pageX - el.offsetLeft
            scrollLeft = el.scrollLeft
            el.style.cursor = 'grabbing'
        }
        const onMouseUp = () => {
            isDown = false
            el.style.cursor = 'grab'
        }
        const onMouseMove = e => {
            if (!isDown) return
            e.preventDefault()
            const x = e.pageX - el.offsetLeft
            el.scrollLeft = scrollLeft - (x - startX)
        }

        el.addEventListener('mousedown', onMouseDown)
        el.addEventListener('mouseup', onMouseUp)
        el.addEventListener('mouseleave', onMouseUp)
        el.addEventListener('mousemove', onMouseMove)
        return () => {
            el.removeEventListener('mousedown', onMouseDown)
            el.removeEventListener('mouseup', onMouseUp)
            el.removeEventListener('mouseleave', onMouseUp)
            el.removeEventListener('mousemove', onMouseMove)
        }
    }, [])

    const filtered = useMemo(() => {
        if (view === 'today') return data.filter(p => p.DateTime.slice(0, 10) === todayStr)
        if (view === 'tomorrow') return data.filter(p => p.DateTime.slice(0, 10) === tomorrowStr)
        return data.filter(p =>
            p.DateTime.slice(0, 10) === todayStr ||
            p.DateTime.slice(0, 10) === tomorrowStr
        )
    }, [data, view, todayStr, tomorrowStr])

    const chartData = useMemo(() =>
        intervalMode === '1hour' ? toHourly(filtered) : filtered,
        [filtered, intervalMode]
    )

    // Index of current interval bar
    const currentIndex = useMemo(() => {
        if (view === 'tomorrow') return -1
        const nowMs = Date.now()
        let idx = -1
        for (let i = 0; i < chartData.length; i++) {
            if (new Date(chartData[i].DateTime).getTime() <= nowMs) idx = i
            else break
        }
        return idx
    }, [chartData, view])

    // Scroll to current time on load
    useEffect(() => {
        if (!scrollRef.current || view !== 'today') return
        const nowHelsinki = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }))
        const progress = (nowHelsinki.getHours() * 60 + nowHelsinki.getMinutes()) / (24 * 60)
        const totalWidth = chartData.length * MIN_BAR_WIDTH[intervalMode]
        const scrollTo = totalWidth * progress - containerWidth / 2
        scrollRef.current.scrollLeft = Math.max(0, scrollTo)
    }, [chartData, intervalMode, view, containerWidth])

    const prices = chartData.map(p => tocents(p.PriceNoTax))
    const colors = prices.map(p => getColor(p, fixedPrice, c))
    const borderColors = prices.map((_, i) =>
        i === currentIndex ? 'rgba(255,255,255,0.7)' : 'transparent'
    )
    const borderWidths = prices.map((_, i) => i === currentIndex ? 2 : 0)

    const labels = chartData.map(p => {
        const prefix = view === 'both'
            ? (p.DateTime.slice(0, 10) === todayStr ? 'T ' : 'H ')
            : ''
        return prefix + fmtTime(p.DateTime)
    })

    const chartWidth = Math.max(chartData.length * MIN_BAR_WIDTH[intervalMode], containerWidth)

    const intervalLabel = intervalMode === '1hour' ? 'tunnittain' : '15 min'
    const dayLabel = view === 'today' ? 'Tänään' : view === 'tomorrow' ? 'Huomenna' : 'Tänään & huomenna'

    const chartConfig = {
        labels,
        datasets: [
            {
                type: 'bar',
                label: 'Hinta (snt/kWh)',
                data: prices,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: borderWidths,
                borderRadius: 2,
                barPercentage: 0.85,
            },
            {
                type: 'line',
                label: `Kiinteä (${fixedPrice} snt)`,
                data: Array(chartData.length).fill(fixedPrice),
                borderColor: c.fixedLine,
                borderDash: [6, 3],
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                hidden: !showFixed,
            }
        ]
    }

    const options = {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            nowLine: { index: currentIndex, color: c.nowLine },
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => {
                        if (ctx.datasetIndex === 0) {
                            const diff = (ctx.raw - fixedPrice).toFixed(2)
                            const sign = diff > 0 ? '+' : ''
                            return `${ctx.raw.toFixed(2)} snt (${sign}${diff} snt vs kiinteä)`
                        }
                        return `Kiinteä: ${ctx.raw} snt`
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: c.tick,
                    maxRotation: 60,
                    font: { size: 10 },
                    autoSkip: true,
                    maxTicksLimit: intervalMode === '15min' ? 24 : 12,
                },
                grid: { color: c.gridX }
            },
            y: {
                ticks: { color: c.tick, callback: v => v + ' snt', font: { size: 11 } },
                grid: { color: c.gridY }
            }
        }
    }

    return (
        <div className="chart-container" ref={containerRef}>
            <div className="chart-header">
                <h2 className="section-title">{dayLabel} — {intervalLabel}</h2>
                <div className="chart-controls">
                    <div className="toggle-group">
                        {[['today', 'Tänään'], ['tomorrow', 'Huomenna'], ['both', 'Molemmat']].map(([v, label]) => (
                            <button
                                key={v}
                                className={view === v ? 'toggle-btn active' : 'toggle-btn'}
                                onClick={() => setView(v)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="toggle-group">
                        {[['15min', '15 min'], ['1hour', '1 tunti']].map(([val, label]) => (
                            <button
                                key={val}
                                className={intervalMode === val ? 'toggle-btn active' : 'toggle-btn'}
                                onClick={() => setIntervalMode(val)}
                            >
                                {label}
                            </button>
                        ))}
                        <button
                            className={showFixed ? 'toggle-btn active' : 'toggle-btn'}
                            onClick={() => setShowFixed(f => !f)}
                        >
                            Kiinteä {fixedPrice} snt
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ position: 'relative' }}>
                <div ref={scrollRef} className="chart-scroll-wrapper">
                    <div style={{ width: chartWidth, height: 280 }}>
                        <Chart
                            key={`${view}-${intervalMode}`}
                            type="bar"
                            data={chartConfig}
                            options={options}
                            width={chartWidth}
                            height={280}
                            aria-label={`Sähkön hintakaavio — ${dayLabel}, ${intervalLabel}`}
                            role="img"
                        />
                    </div>
                </div>
            </div>

            <div className="chart-legend">
                <span className="legend-dot" style={{ background: c.legendCheap }} /> Alle kiinteän
                <span className="legend-dot" style={{ background: c.legendModerate }} /> Kohtalainen
                <span className="legend-dot" style={{ background: c.legendExpensive }} /> Kallis
                {view !== 'tomorrow' && <span className="legend-now">— valkoinen reuna = nyt</span>}
            </div>
        </div>
    )
}
