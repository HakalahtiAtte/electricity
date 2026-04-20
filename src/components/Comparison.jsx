import { useState } from 'react'
import { tocents, getTodayStr, getTomorrowStr } from '../hooks/usePrices'

function fmt(c) { return c.toFixed(2) }

function getClass(cents, fixedPrice) {
    if (cents < fixedPrice) return 'cheap'
    if (cents < fixedPrice * 1.4) return 'moderate'
    return 'expensive'
}

function CompItem({ label, avg, fixedPrice }) {
    if (avg === null) {
        return (
            <div className="comp-item">
                <div className="comp-period">{label} avg</div>
                <div className="comp-avg muted">No data yet</div>
                <div className="comp-diff muted">Prices not published yet</div>
            </div>
        )
    }
    const diff = avg - fixedPrice
    const cheaper = diff < 0
    return (
        <div className="comp-item">
            <div className="comp-period">{label} avg</div>
            <div className={`comp-avg ${getClass(avg, fixedPrice)}`}>{fmt(avg)} c/kWh</div>
            <div className={`comp-diff ${cheaper ? 'cheaper' : 'pricier'}`}>
                {cheaper
                    ? `${Math.abs(diff).toFixed(2)}c cheaper than fixed`
                    : `${diff.toFixed(2)}c pricier than fixed`}
            </div>
        </div>
    )
}

export default function Comparison({ data, fixedPrice }) {
    const [open, setOpen] = useState(true)
    const todayStr    = getTodayStr()
    const tomorrowStr = getTomorrowStr()

    const today          = data.filter(p => p.DateTime.slice(0, 10) === todayStr)
    const tomorrow       = data.filter(p => p.DateTime.slice(0, 10) === tomorrowStr)
    const todayAndTomorrow = data.filter(p =>
        p.DateTime.slice(0, 10) === todayStr ||
        p.DateTime.slice(0, 10) === tomorrowStr
    )

    const avg = arr => arr.length
        ? arr.reduce((s, p) => s + tocents(p.PriceNoTax), 0) / arr.length
        : null

    return (
        <div className="comparison">
            <div
                className="section-header"
                role="button"
                tabIndex={0}
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}
            >
                <h2 className="section-title">Fixed price vs spot averages</h2>
                <span className="collapse-btn" aria-hidden="true">{open ? '▲' : '▼'}</span>
            </div>
            {open && (
                <div className="comp-grid">
                    <CompItem label="Today"            avg={avg(today)}           fixedPrice={fixedPrice} />
                    <CompItem label="Tomorrow"         avg={avg(tomorrow)}         fixedPrice={fixedPrice} />
                    <CompItem label="Today & tomorrow" avg={avg(todayAndTomorrow)} fixedPrice={fixedPrice} />
                </div>
            )}
        </div>
    )
}
