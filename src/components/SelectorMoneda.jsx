export default function SelectorMoneda({ monedaBase, tasas, moneda, tasaCambio, onChange }) {
  function cambiarMoneda(nuevaMoneda) {
    if (nuevaMoneda === monedaBase) {
      onChange({ moneda: nuevaMoneda, tasa_cambio: 1 });
      return;
    }
    const tasa = tasas.find((t) => t.moneda === nuevaMoneda);
    onChange({ moneda: nuevaMoneda, tasa_cambio: tasa ? Number(tasa.tasa) : 1 });
  }

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <label>
        Moneda
        <select value={moneda} onChange={(e) => cambiarMoneda(e.target.value)}>
          <option value={monedaBase}>{monedaBase} (moneda base)</option>
          {tasas.map((t) => (
            <option key={t.moneda} value={t.moneda}>
              {t.moneda} — {t.nombre}
            </option>
          ))}
        </select>
      </label>
      {moneda !== monedaBase && (
        <label>
          Tasa (1 {moneda} = ? {monedaBase})
          <input
            type="number"
            step="any"
            value={tasaCambio}
            onChange={(e) => onChange({ moneda, tasa_cambio: e.target.value })}
          />
        </label>
      )}
    </div>
  );
}
