export default function GraficoBarras({ datos, formatoValor = String, horizontal = false, colorBarra = "var(--color-primario)" }) {
  if (!datos || datos.length === 0 || datos.every((d) => !d.valor)) {
    return <p style={{ fontSize: 13, opacity: 0.6 }}>Sin datos todavía.</p>;
  }

  const max = Math.max(...datos.map((d) => d.valor), 1);

  if (horizontal) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {datos.map((d) => (
          <div key={d.etiqueta} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              title={d.etiqueta}
              style={{
                width: 160,
                fontSize: 12,
                opacity: 0.75,
                textAlign: "right",
                flexShrink: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {d.etiqueta}
            </div>
            <div style={{ flex: 1, background: "var(--color-borde)", borderRadius: 4, height: 18 }}>
              <div
                title={formatoValor(d.valor)}
                style={{
                  width: `${Math.max((d.valor / max) * 100, d.valor > 0 ? 3 : 0)}%`,
                  height: "100%",
                  background: colorBarra,
                  borderRadius: 4,
                }}
              />
            </div>
            <div style={{ width: 74, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{formatoValor(d.valor)}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, paddingTop: 20 }}>
      {datos.map((d) => (
        <div
          key={d.etiqueta}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, whiteSpace: "nowrap" }}>
            {d.valor > 0 ? formatoValor(d.valor) : ""}
          </div>
          <div
            title={formatoValor(d.valor)}
            style={{
              width: "100%",
              maxWidth: 44,
              height: `${Math.max((d.valor / max) * 100, d.valor > 0 ? 3 : 0)}%`,
              background: colorBarra,
              borderRadius: "4px 4px 0 0",
            }}
          />
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>{d.etiqueta}</div>
        </div>
      ))}
    </div>
  );
}
