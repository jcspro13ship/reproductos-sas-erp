import { resolverImagenDrive } from "../lib/imagenDrive";

export default function CotizacionImprimible({ empresa, cotizacion, cliente, lista, items, notas, totalUsd }) {
  const logoUrl = resolverImagenDrive(empresa?.logo_url);
  const total = items.reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precio_unitario) || 0), 0);
  const moneda = lista?.moneda || empresa?.moneda_base || "COP";

  function formatoMonto(n) {
    return `$${Number(n || 0).toLocaleString("es-CO")} ${moneda}`;
  }

  return (
    <div className="print-only" style={{ maxWidth: 720, margin: "24px auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #222", paddingBottom: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {logoUrl && <img src={logoUrl} alt="" style={{ height: 48, width: "auto" }} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{empresa?.nombre}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {empresa?.nit && <>NIT {empresa.nit} · </>}
              {empresa?.direccion}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{empresa?.telefono}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6 }}>Cotización</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{cotizacion?.id}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{cotizacion?.fecha}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6, marginBottom: 4 }}>Cliente</div>
        <div style={{ fontWeight: 600 }}>{cliente?.nombre || "—"}</div>
        {cliente?.contacto && <div style={{ fontSize: 13 }}>{cliente.contacto}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            <th style={{ textAlign: "left", padding: "6px 4px" }}>Producto</th>
            <th style={{ textAlign: "center", padding: "6px 4px" }}>Cant.</th>
            <th style={{ textAlign: "right", padding: "6px 4px" }}>Precio unit.</th>
            <th style={{ textAlign: "right", padding: "6px 4px" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "6px 4px" }}>{i.producto?.nombre || i.producto_id}</td>
              <td style={{ textAlign: "center", padding: "6px 4px" }}>{i.cantidad}</td>
              <td style={{ textAlign: "right", padding: "6px 4px" }}>{formatoMonto(i.precio_unitario)}</td>
              <td style={{ textAlign: "right", padding: "6px 4px" }}>{formatoMonto(i.cantidad * i.precio_unitario)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <div style={{ minWidth: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, borderTop: "2px solid #222", paddingTop: 8 }}>
            <span>Total</span>
            <span>{formatoMonto(total)}</span>
          </div>
          {totalUsd != null && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              <span>Equivalente</span>
              <span>≈ ${totalUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })} USD</span>
            </div>
          )}
        </div>
      </div>

      {notas && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6, marginBottom: 4 }}>Observaciones</div>
          <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{notas}</div>
        </div>
      )}
    </div>
  );
}
