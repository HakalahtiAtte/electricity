import { useState, useEffect, useRef } from 'react'
import { usePrices, getCurrentEntry, tocents } from './hooks/usePrices'
import SettingsBar from './components/SettingsBar'
import SummaryCards from './components/SummaryCards'
import PriceChart from './components/PriceChart'
import Comparison from './components/Comparison'
import BestTimes from './components/BestTimes'

function priceClass(cents, fixed) {
    if (cents < fixed) return 'cheap'
    if (cents < fixed * 1.4) return 'moderate'
    return 'expensive'
}

function fmtCountdown(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

export default function App() {
    const [fixedPrice, setFixedPrice] = useState(8.5)
    const { data, loading, error, lastUpdated } = usePrices()
    const [heroVisible, setHeroVisible] = useState(true)
    const [countdown, setCountdown] = useState(null)

    // Countdown to next refresh
    useEffect(() => {
        if (!lastUpdated) return
        const tick = () => {
            const elapsed = Math.floor((Date.now() - lastUpdated) / 1000)
            setCountdown(Math.max(0, 15 * 60 - elapsed))
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [lastUpdated])

    // Track hero card visibility for sticky header
    useEffect(() => {
        const hero = document.querySelector('.current-price-hero')
        if (!hero) return
        const obs = new IntersectionObserver(
            ([entry]) => setHeroVisible(entry.isIntersecting),
            { threshold: 0 }
        )
        obs.observe(hero)
        return () => obs.disconnect()
    }, [data])

    // Update browser tab title
    useEffect(() => {
        if (!data.length) return
        const current = getCurrentEntry(data)
        if (current) {
            document.title = `${tocents(current.PriceNoTax).toFixed(2)}c — Electricity Prices`
        }
    }, [data])

    const current = data.length ? getCurrentEntry(data) : null
    const currentCents = current ? tocents(current.PriceNoTax) : null
    const nowMs = Date.now()
    const nextEntry = data.find(p => new Date(p.DateTime).getTime() > nowMs)
    const nextCents = nextEntry ? tocents(nextEntry.PriceNoTax) : null

    return (
        <div className="app">
            {/* Compact sticky header — visible once hero scrolls out of view */}
            {!heroVisible && currentCents !== null && (
                <div className={`sticky-price-bar ${priceClass(currentCents, fixedPrice)}`}>
                    <div className="sticky-left">
                        <span className="sticky-label">Now</span>
                        <span className="sticky-price">{currentCents.toFixed(2)}c</span>
                        {nextCents !== null && (
                            <span className={`sticky-trend ${nextCents > currentCents ? 'trend-up' : 'trend-down'}`}>
                                {nextCents > currentCents ? '↑' : '↓'} {nextCents.toFixed(2)}c
                            </span>
                        )}
                    </div>
                    {countdown !== null && (
                        <span className="sticky-countdown">↻ {fmtCountdown(countdown)}</span>
                    )}
                </div>
            )}

            <header className="app-header">
                <div>
                    <h1>Electricity Prices</h1>
                    <p className="app-subtitle">Finland spot prices · incl. VAT 25.5%</p>
                </div>
                {lastUpdated && (
                    <div className="header-meta">
                        <span className="updated-at">
                            Updated {lastUpdated.toLocaleTimeString('fi-FI', {
                                timeZone: 'Europe/Helsinki',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                        {countdown !== null && (
                            <span className="next-refresh">↻ {fmtCountdown(countdown)}</span>
                        )}
                    </div>
                )}
            </header>

            <SettingsBar fixedPrice={fixedPrice} onChange={setFixedPrice} />

            {loading && <div className="status-msg">Loading prices...</div>}
            {error && <div className="status-msg error">{error}</div>}

            {!loading && !error && data.length > 0 && (
                <>
                    <SummaryCards data={data} fixedPrice={fixedPrice} />
                    <PriceChart data={data} fixedPrice={fixedPrice} />
                    <Comparison data={data} fixedPrice={fixedPrice} />
                    <BestTimes data={data} fixedPrice={fixedPrice} />
                </>
            )}
        </div>
    )
}
