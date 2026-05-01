import { tocents, getTodayStr, getTomorrowStr, getCurrentEntry } from '../hooks/usePrices'

function fmt(c) { return c.toFixed(2) }

function fmtTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('fi-FI', {
        timeZone: 'Europe/Helsinki',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getClass(cents, fixedPrice) {
    if (cents < fixedPrice) return 'cheap'
    if (cents < fixedPrice * 1.4) return 'moderate'
    return 'expensive'
}

function minEntry(entries) {
    return entries.reduce((m, p) => p.PriceNoTax < m.PriceNoTax ? p : m)
}

function maxEntry(entries) {
    return entries.reduce((m, p) => p.PriceNoTax > m.PriceNoTax ? p : m)
}

export default function SummaryCards({ data, fixedPrice }) {
    const todayStr = getTodayStr()
    const tomorrowStr = getTomorrowStr()

    const today = data.filter(p => p.DateTime.slice(0, 10) === todayStr)
    const tomorrow = data.filter(p => p.DateTime.slice(0, 10) === tomorrowStr)

    const todayCents = today.map(p => tocents(p.PriceNoTax))
    const current = getCurrentEntry(data)
    const currentCents = current ? tocents(current.PriceNoTax) : null

    const nowMs = Date.now()
    const nextEntry = data.find(p => new Date(p.DateTime).getTime() > nowMs)
    const nextCents = nextEntry ? tocents(nextEntry.PriceNoTax) : null
    const trendUp = nextCents !== null && currentCents !== null && nextCents > currentCents

    const avg = todayCents.length
        ? todayCents.reduce((a, b) => a + b, 0) / todayCents.length
        : null
    const cheaperCount = todayCents.filter(c => c < fixedPrice).length

    const todayLow  = today.length ? minEntry(today) : null
    const todayHigh = today.length ? maxEntry(today) : null
    const tmrLow    = tomorrow.length ? minEntry(tomorrow) : null
    const tmrHigh   = tomorrow.length ? maxEntry(tomorrow) : null

    const heroClass = currentCents !== null ? getClass(currentCents, fixedPrice) : ''

    return (
        <>
            <div className={`current-price-hero ${heroClass}`}>
                <div className="current-price-label">Nykyinen hinta</div>
                {currentCents !== null ? (
                    <>
                        <div className="current-price-row">
                            <div className="current-price-value">
                                {fmt(currentCents)}
                                <span className="current-price-unit">snt/kWh</span>
                            </div>
                            {nextCents !== null && (
                                <div className={`price-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
                                    <span className="trend-arrow">{trendUp ? '↑' : '↓'}</span>
                                    <span className="trend-label">
                                        Seur. {fmt(nextCents)} snt
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="current-price-sub">sis. ALV 25,5 %</div>
                        <div className={currentCents < fixedPrice ? 'badge saving' : 'badge losing'}>
                            {currentCents < fixedPrice
                                ? `${(fixedPrice - currentCents).toFixed(2)} snt alle kiinteän`
                                : `${(currentCents - fixedPrice).toFixed(2)} snt yli kiinteän`}
                        </div>
                    </>
                ) : (
                    <div className="current-price-value">—</div>
                )}
            </div>

            <div className="cards">
                <div className="card">
                    <div className="card-label">Tänään keskiarvo</div>
                    {avg !== null ? (
                        <>
                            <div className={`card-value ${getClass(avg, fixedPrice)}`}>{fmt(avg)}</div>
                            <div className="card-unit">snt/kWh sis. ALV</div>
                            <div className={avg < fixedPrice ? 'badge saving' : 'badge losing'}>
                                {avg < fixedPrice
                                    ? `ka. ${(fixedPrice - avg).toFixed(2)} snt alle kiinteän`
                                    : `ka. ${(avg - fixedPrice).toFixed(2)} snt yli kiinteän`}
                            </div>
                        </>
                    ) : (
                        <div className="card-value">—</div>
                    )}
                </div>

                <div className="card">
                    <div className="card-label">Tänään alin</div>
                    {todayLow ? (
                        <>
                            <div className="card-value cheap">{fmt(tocents(todayLow.PriceNoTax))}</div>
                            <div className="card-unit">snt/kWh sis. ALV</div>
                            <div className="card-time">klo {fmtTime(todayLow.DateTime)}</div>
                        </>
                    ) : (
                        <div className="card-value">—</div>
                    )}
                </div>

                <div className="card">
                    <div className="card-label">Tänään korkein</div>
                    {todayHigh ? (
                        <>
                            <div className="card-value expensive">{fmt(tocents(todayHigh.PriceNoTax))}</div>
                            <div className="card-unit">snt/kWh sis. ALV</div>
                            <div className="card-time">klo {fmtTime(todayHigh.DateTime)}</div>
                        </>
                    ) : (
                        <div className="card-value">—</div>
                    )}
                </div>

                <div className="card">
                    <div className="card-label">Alle kiinteän hinnan</div>
                    <div className="card-value cheap">
                        {todayCents.length ? `${cheaperCount} / ${todayCents.length}` : '—'}
                    </div>
                    <div className="card-unit">jaksoa tänään</div>
                </div>

                <div className="card">
                    <div className="card-label">Huomenna alin</div>
                    {tmrLow ? (
                        <>
                            <div className="card-value cheap">{fmt(tocents(tmrLow.PriceNoTax))}</div>
                            <div className="card-unit">snt/kWh sis. ALV</div>
                            <div className="card-time">klo {fmtTime(tmrLow.DateTime)}</div>
                        </>
                    ) : (
                        <>
                            <div className="card-value muted">—</div>
                            <div className="card-time muted">Julkaistaan ~klo 14:15</div>
                        </>
                    )}
                </div>

                <div className="card">
                    <div className="card-label">Huomenna korkein</div>
                    {tmrHigh ? (
                        <>
                            <div className="card-value expensive">{fmt(tocents(tmrHigh.PriceNoTax))}</div>
                            <div className="card-unit">snt/kWh sis. ALV</div>
                            <div className="card-time">klo {fmtTime(tmrHigh.DateTime)}</div>
                        </>
                    ) : (
                        <>
                            <div className="card-value muted">—</div>
                            <div className="card-time muted">Julkaistaan ~klo 14:15</div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
