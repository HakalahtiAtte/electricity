# Sähkön spot-hinnat

Real-time Finnish electricity spot prices with VAT, updated every 15 minutes. Compare against your fixed contract price and find the cheapest hours of the day.

## Features

- Current price with colour-coded cheap / moderate / expensive status
- Daily min/max and average, with tomorrow's prices once published (~14:15)
- Scrollable bar chart with 15-minute or hourly intervals
- Fixed-price comparison — see exactly how much you're saving or overpaying
- Best-time finder for scheduling high-consumption tasks
- Light and dark theme

## Stack

- React 19 + Vite
- Chart.js via react-chartjs-2
- Deployed on Netlify
- Price data from [spot-hinta.fi](https://spot-hinta.fi)

## Development

```bash
npm install
npm run dev
```

To expose the dev server on your local network (e.g. for mobile testing):

```bash
npm run dev -- --host
```

## License

MIT
