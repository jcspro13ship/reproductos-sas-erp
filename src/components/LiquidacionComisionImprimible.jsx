import { resolverImagenDrive } from "../lib/imagenDrive";
import { formatoMoneda } from "../lib/formato";

// Documento imprimible con el valor de comisión a pagar a un vendedor,
// dirigido a esa persona — mismo estilo corporativo que la cotización y la
// venta imprimibles (logo, datos de la empresa, tabla, total).
export default function LiquidacionComisionImprimible({ empresa, vendedor, periodoEtiqueta, fechaEmision, items }) {
  const logoUrl = resolverImagenDrive(empresa?.logo_url);
  const total = items.reduce((s, i) => s + (Number(i.valor_comision) || 0), 0);

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
          <div style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6 }}>Liquidación de comisiones</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{fechaEmision}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6, marginBottom: 4 }}>Dirigido a</div>
        <div style={{ fontWeight: 600 }}>{vendedor?.nombre || "—"}</div>
        {vendedor?.email && <div style={{ fontSize: 13, opacity: 0.7 }}>{vendedor.email}</div>}
      </div>

      <p style={{ fontSize: 13, marginBottom: 16 }}>
        Por medio del presente documento se liquida el valor de la comisión correspondiente a las siguientes
        ventas{periodoEtiqueta ? ` (${periodoEtiqueta})` : ""}:
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            <th style={{ textAlign: "left", padding: "6px 4px" }}>Fecha</th>
            <th style={{ textAlign: "left", padding: "6px 4px" }}>Venta</th>
            <th style={{ textAlign: "left", padding: "6px 4px" }}>Cliente</th>
            <th style={{ textAlign: "right", padding: "6px 4px" }}>Comisión</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={i.venta_id || idx} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "6px 4px" }}>{i.fecha}</td>
              <td style={{ padding: "6px 4px" }}>{i.venta_id}</td>
              <td style={{ padding: "6px 4px" }}>{i.clienteNombre || "—"}</td>
              <td style={{ textAlign: "right", padding: "6px 4px" }}>{formatoMoneda(i.valor_comision)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <div style={{ minWidth: 220, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, borderTop: "2px solid #222", paddingTop: 8 }}>
          <span>Total a pagar</span>
          <span>{formatoMoneda(total)}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 64 }}>
        <div style={{ width: 220, textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #222", paddingTop: 4, fontSize: 12 }}>Autoriza — {empresa?.nombre}</div>
        </div>
        <div style={{ width: 220, textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #222", paddingTop: 4, fontSize: 12 }}>Recibí conforme — {vendedor?.nombre}</div>
        </div>
      </div>
    </div>
  );
}
