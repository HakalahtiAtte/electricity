import { useState } from 'react'

export default function SettingsBar({ fixedPrice, onChange }) {
    const [raw, setRaw] = useState(String(fixedPrice))

    function handleChange(e) {
        const val = e.target.value.replace(',', '.')
        setRaw(e.target.value)
        const num = parseFloat(val)
        if (!isNaN(num) && num >= 0) onChange(num)
    }

    function handleBlur() {
        const val = raw.replace(',', '.')
        const num = parseFloat(val)
        if (isNaN(num) || num < 0) setRaw(String(fixedPrice))
    }

    return (
        <div className="settings-bar">
            <label htmlFor="fixed-input">Your fixed contract price</label>
            <div className="settings-input-group">
                <input
                    id="fixed-input"
                    type="text"
                    inputMode="decimal"
                    value={raw}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />
                <span className="unit-label">c/kWh</span>
            </div>
            <div className="fixed-badge">
                Comparing to {fixedPrice.toFixed(1)} c/kWh
            </div>
        </div>
    )
}
