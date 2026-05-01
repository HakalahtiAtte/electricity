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
                <div className="comp-period">{label} ka.</div>
                <div className="comp-avg muted">Ei tietoja</div>
                <div className="comp-diff muted">Hintoja ei julkaistu vielä</div>
            </div>
        )
    }
    const diff = avg - fixedPrice
    const cheaper = diff < 0
    return (
        <div className="comp-item">
            <div className="comp-period">{label} ka.</div>
            <div className={`comp-avg ${getClass(avg, fixedPrice)}`}>{fmt(avg)} snt/kWh</div>
            <div className={`comp-diff ${cheaper ? 'cheaper' : 'pricier'}`}>
                {cheaper
                    ? `${Math.abs(diff).toFixed(2)} snt halvempi kuin kiinteä`
                    : `${diff.toFixed(2)} snt kalliimpi kuin kiinteä`}
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
                <h2 className="section-title">Kiinteä hinta vs spot-keskiarvot</h2>
                <span className="collapse-btn" aria-hidden="true">{open ? '▲' : '▼'}</span>
            </div>
            {open && (
                <div className="comp-grid">
                    <CompItem label="Tänään"            avg={avg(today)}           fixedPrice={fixedPrice} />
                    <CompItem label="Huomenna"         avg={avg(tomorrow)}         fixedPrice={fixedPrice} />
                    <CompItem label="Tänään & huomenna" avg={avg(todayAndTomorrow)} fixedPrice={fixedPrice} />
                </div>
            )}
        </div>
    )
}
