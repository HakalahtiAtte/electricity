export default function SettingsBar({ fixedPrice, onChange }) {
    return (
        <div className="settings-bar">
            <label htmlFor="fixed-input">Your fixed contract price</label>
            <div className="settings-input-group">
                <input
                    id="fixed-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={fixedPrice}
                    onChange={e => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
                />
                <span className="unit-label">c/kWh</span>
            </div>
            <div className="fixed-badge">
                Comparing to {fixedPrice.toFixed(1)} c/kWh
            </div>
        </div>
    )
}