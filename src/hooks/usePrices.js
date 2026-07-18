import { useState, useEffect } from 'react'

const VAT = 1.255

export function tocents(priceNoTax) {
    return priceNoTax * VAT * 100
}

export function getTodayStr() {
    const fi = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }))
    return fi.getFullYear() + '-' +
        String(fi.getMonth() + 1).padStart(2, '0') + '-' +
        String(fi.getDate()).padStart(2, '0')
}

export function getTomorrowStr() {
    const fi = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }))
    fi.setDate(fi.getDate() + 1)
    return fi.getFullYear() + '-' +
        String(fi.getMonth() + 1).padStart(2, '0') + '-' +
        String(fi.getDate()).padStart(2, '0')
}

export function toHourly(data) {
    const groups = {}
    for (const p of data) {
        const key = p.DateTime.slice(0, 13) // group by "YYYY-MM-DDTHH"
        if (!groups[key]) groups[key] = []
        groups[key].push(p)
    }
    return Object.values(groups).map(chunk => ({
        DateTime: chunk[0].DateTime,
        PriceNoTax: chunk.reduce((s, p) => s + p.PriceNoTax, 0) / chunk.length,
    }))
}

export function getCurrentEntry(data, nowMs = Date.now()) {
    return data
        .filter(p => new Date(p.DateTime).getTime() <= nowMs)
        .sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime))[0]
}

// Render-safe clock: components read `now` from state instead of calling
// Date.now() directly during render (impure, breaks react-hooks/purity).
export function useNow(intervalMs = 30000) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs)
        return () => clearInterval(id)
    }, [intervalMs])
    return now
}

export function usePrices() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(null)

    useEffect(() => {
        async function load() {
            setError(null)
            try {
                const res = await fetch('https://api.spot-hinta.fi/TodayAndDayForward')
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const json = await res.json()
                if (!Array.isArray(json)) throw new Error('Unexpected response format')
                const valid = json.filter(p => p && typeof p.DateTime === 'string' && typeof p.PriceNoTax === 'number' && isFinite(p.PriceNoTax))
                const sorted = valid.sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime))
                setData(sorted)
                setLastUpdated(new Date())
            } catch (e) {
                console.error('Hintojen lataus epäonnistui', e)
                setError('Hintojen lataus epäonnistui. Yritä uudelleen.')
            } finally {
                setLoading(false)
            }
        }
        load()
        const interval = setInterval(load, 15 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    return { data, loading, error, lastUpdated }
}
