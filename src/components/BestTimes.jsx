import { useState } from 'react'
import { tocents, getTodayStr, toHourly } from '../hooks/usePrices'

function fmt(c) { return c.toFixed(2) }

function getClass(cents, fixedPrice) {
    if (cents < fixedPrice) return 'cheap'
    if (cents < fixedPrice * 1.4) return 'moderate'
    return 'expensive'
}

function fmtTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('fi-FI', {
        timeZone: 'Europe/Helsinki',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function BestTimes({ data, fixedPrice }) {
    const [intervalMode, setIntervalMode] = useState('15min')
    const [open, setOpen] = useState(true)

    const todayStr = getTodayStr()
    const today = data.filter(p => p.DateTime.slice(0, 10) === todayStr)
    const slots = intervalMode === '1hour' ? toHourly(today) : today
    const slotMins = intervalMode === '1hour' ? 60 : 15
    const sorted = [...slots].sort((a, b) => a.PriceNoTax - b.PriceNoTax).slice(0, 8)

    return (
        <div className="best-times">
            <div className="best-times-header">
                <div
                    className="section-header"
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => setOpen(o => !o)}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}
                    style={{ flex: 1, marginBottom: 0 }}
                >
                    <h2 className="section-title">
                        {intervalMode === '15min' ? 'Parhaat 15 min jaksot tänään' : 'Parhaat tunnit tänään'}
                    </h2>
                </div>

                {open && (
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
                    </div>
                )}

                <span
                    className="collapse-btn"
                    aria-hidden="true"
                    onClick={() => setOpen(o => !o)}
                    style={{ marginLeft: '8px' }}
                >
                    {open ? '▲' : '▼'}
                </span>
            </div>

            {open && sorted.map((p) => {
                const cents = tocents(p.PriceNoTax)
                const start = fmtTime(p.DateTime)
                const endD = new Date(new Date(p.DateTime).getTime() + slotMins * 60000)
                const end = endD.toLocaleTimeString('fi-FI', {
                    timeZone: 'Europe/Helsinki',
                    hour: '2-digit',
                    minute: '2-digit',
                })
                const belowFixed = cents < fixedPrice

                return (
                    <div key={p.DateTime} className="time-slot">
                        <div className="time-slot-left">
                            <span className="time-range">{start} – {end}</span>
                            {belowFixed && (
                                <span className="below-fixed">
                                    {(fixedPrice - cents).toFixed(2)} snt alle kiinteän
                                </span>
                            )}
                        </div>
                        <span className={`slot-price ${getClass(cents, fixedPrice)}`}>
                            {fmt(cents)} snt/kWh
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
