export default function KpiCard({ etiqueta, valor, alerta }) {
  return (
    <div
      style={{
        border: `1px solid ${alerta ? "crimson" : "var(--color-borde)"}`,
        borderRadius: "var(--radio)",
        padding: 16,
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{etiqueta}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: alerta ? "crimson" : "inherit" }}>{valor}</div>
    </div>
  );
}
