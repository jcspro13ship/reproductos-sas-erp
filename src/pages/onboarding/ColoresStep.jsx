export default function ColoresStep({ colores, onChange }) {
  function set(campo) {
    return (e) => onChange({ ...colores, [campo]: e.target.value });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
      <h2 style={{ fontSize: 18 }}>Colores de marca</h2>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        Definen el tema visual del panel interno y del catálogo público.
      </p>
      <label>
        Color primario
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="color" value={colores.primario} onChange={set("primario")} style={{ width: 48, padding: 2 }} />
          <input value={colores.primario} onChange={set("primario")} style={{ flex: 1 }} />
        </div>
      </label>
      <label>
        Color secundario
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="color" value={colores.secundario} onChange={set("secundario")} style={{ width: 48, padding: 2 }} />
          <input value={colores.secundario} onChange={set("secundario")} style={{ flex: 1 }} />
        </div>
      </label>
      <div
        style={{
          marginTop: 8,
          padding: 16,
          borderRadius: "var(--radio)",
          background: colores.primario,
          color: "#fff",
        }}
      >
        Vista previa
        <span style={{ background: colores.secundario, color: "#000", padding: "2px 8px", borderRadius: 4, marginLeft: 8 }}>
          Acento
        </span>
      </div>
    </div>
  );
}
