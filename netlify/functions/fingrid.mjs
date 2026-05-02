const VAT = 1.255
const DATASET_ID = 105

function daysAgo(n) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - n)
    d.setUTCHours(0, 0, 0, 0)
    return d
}

export const handler = async () => {
    const apiKey = process.env.FINGRID_API_KEY
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'FINGRID_API_KEY not set' })
        }
    }

    const startTime = daysAgo(365).toISOString()
    const endTime = new Date().toISOString()
    const url = new URL(`https://data.fingrid.fi/api/datasets/${DATASET_ID}/data`)
    url.searchParams.set('startTime', startTime)
    url.searchParams.set('endTime', endTime)
    url.searchParams.set('format', 'json')
    url.searchParams.set('pageSize', '10000')

    try {
        const res = await fetch(url.toString(), {
            headers: { 'x-api-key': apiKey }
        })
        if (!res.ok) {
            return {
                statusCode: res.status,
                body: JSON.stringify({ error: `Fingrid responded with ${res.status}` })
            }
        }

        const json = await res.json()
        const rows = json.data ?? []

        if (!rows.length) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
                body: JSON.stringify({ week: null, month: null, year: null })
            }
        }

        const now = Date.now()
        const week7   = rows.filter(r => now - new Date(r.startTime).getTime() <= 7  * 86400000)
        const month30 = rows.filter(r => now - new Date(r.startTime).getTime() <= 30 * 86400000)
        const avg = arr => arr.length
            ? parseFloat((arr.reduce((s, r) => s + r.value, 0) / arr.length / 10 * VAT).toFixed(4))
            : null

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
            body: JSON.stringify({
                week:  avg(week7),
                month: avg(month30),
                year:  avg(rows)
            })
        }
    } catch (e) {
        return {
            statusCode: 502,
            body: JSON.stringify({ error: e.message })
        }
    }
}
