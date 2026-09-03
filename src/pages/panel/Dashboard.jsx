import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { formatoMoneda } from "../../lib/formato";
import {
  comisionPendiente,
  resumenCompras,
  porVencerEnDias,
  productosEnNegativo,
  resumenCartera,
  topProductosVendidos,
  resumenVentas,
  ventasPorPeriodo,
} from "../../lib/tablero";
import { resumenFlujoCaja } from "../../lib/caja";
import { PRESETS_PERIODO } from "../../lib/periodo";
import KpiCard from "../../components/KpiCard";
import GraficoBarras from "../../components/GraficoBarras";
import PeriodoSelector from "../../components/PeriodoSelector";

export default function Dashboard() {
  const { sesion, hasAccess } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const primerPreset = PRESETS_PERIODO[0];
  const [periodo, setPeriodo] = useState(() => {
    const [desde, hasta] = primerPreset.rango();
    return { desde, hasta, etiqueta: primerPreset.etiqueta, presetId: primerPreset.id };
  });

  useEffect(() => {
    Promise.all([
      api.list("PRODUCTOS"),
      api.list("VENTAS"),
      api.list("VENTAS_DETALLE"),
      api.list("COMPRAS"),
      api.list("COMPRAS_DETALLE"),
      api.list("COMISIONES"),
      api.list("CXC"),
      api.list("CXP"),
      api.list("PAGOS"),
    ])
      .then(([productos, ventas, ventasDetalle, compras, comprasDetalle, comisiones, cxc, cxp, pagos]) => {
        setDatos({ productos, ventas, ventasDetalle, compras, comprasDetalle, comisiones, cxc, cxp, pagos });
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  const usuarioId = sesion?.usuario?.id;
  const esAdmin = hasAccess("configuracion", "total");
  // Un vendedor (a diferencia de Cartera o Compras, que también pueden ver "ventas")
  // no tiene acceso propio a compras ni a CxP — con eso distinguimos su vista acotada
  // a "lo mío" de la vista completa que ven los demás roles con acceso al módulo.
  const soloMisVentas = !esAdmin && hasAccess("ventas", "ver") && !hasAccess("cxp", "ver") && !hasAccess("compras", "ver");

  const { productos, ventas, ventasDetalle, compras, comprasDetalle, comisiones, cxc, cxp, pagos } = datos;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Tablero de control</h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>Hola {sesion?.usuario?.nombre}.</p>

      <PeriodoSelector presetActivo={periodo.presetId} onCambiar={setPeriodo} />

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {hasAccess("cxc", "ver") && hasAccess("cxp", "ver") && <BloqueFlujoCaja pagos={pagos} periodo={periodo} />}

        {hasAccess("ventas", "ver") && (
          <BloqueVentas
            ventas={ventas}
            ventasDetalle={ventasDetalle}
            comisiones={comisiones}
            productos={productos}
            usuarioId={usuarioId}
            soloPropias={soloMisVentas}
            periodo={periodo}
          />
        )}

        {hasAccess("inventario", "ver") && <BloqueInventario productos={productos} />}

        {hasAccess("compras", "ver") && <BloqueCompras compras={compras} comprasDetalle={comprasDetalle} periodo={periodo} />}

        {(hasAccess("cxc", "ver") || hasAccess("cxp", "ver")) && (
          <BloqueCartera
            cxc={hasAccess("cxc", "ver") ? cxc : null}
            cxp={hasAccess("cxp", "ver") ? cxp : null}
            ventas={ventas}
            vendedorId={soloMisVentas ? usuarioId : null}
          />
        )}
      </div>
    </div>
  );
}

function BloqueVentas({ ventas, ventasDetalle, comisiones, productos, usuarioId, soloPropias, periodo }) {
  const vendedorId = soloPropias ? usuarioId : undefined;
  const resumen = resumenVentas(ventas, ventasDetalle, { desde: periodo.desde, hasta: periodo.hasta, vendedorId });
  const porMes = ventasPorPeriodo(ventas, ventasDetalle, { desde: periodo.desde, hasta: periodo.hasta, vendedorId });
  const topProductos = topProductosVendidos(ventas, ventasDetalle, productos, { desde: periodo.desde, hasta: periodo.hasta, vendedorId });

  return (
    <section>
      <strong style={{ fontSize: 14 }}>{soloPropias ? "Mi desempeño" : "Ventas"}</strong>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Período: {periodo.etiqueta}</p>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        <KpiCard etiqueta={soloPropias ? "Mis ventas" : "Ventas"} valor={resumen.cantidad} />
        <KpiCard etiqueta="Total vendido" valor={formatoMoneda(resumen.total)} />
        {soloPropias && (
          <KpiCard etiqueta="Mi comisión pendiente (todo)" valor={formatoMoneda(comisionPendiente(comisiones, usuarioId))} />
        )}
      </div>

      <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 320, border: "1px solid var(--color-borde)", borderRadius: "var(--radio)", padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            {soloPropias ? "Mis ventas por mes" : "Ventas por mes"}
          </div>
          <GraficoBarras datos={porMes} formatoValor={formatoMoneda} />
        </div>
        <div style={{ flex: 1, minWidth: 280, border: "1px solid var(--color-borde)", borderRadius: "var(--radio)", padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            {soloPropias ? "Mis productos más vendidos" : "Top productos vendidos"}
          </div>
          <GraficoBarras datos={topProductos} formatoValor={(v) => `${v} und`} horizontal />
        </div>
      </div>
    </section>
  );
}

function BloqueInventario({ productos }) {
  const enNegativo = productosEnNegativo(productos);
  return (
    <section>
      <strong style={{ fontSize: 14 }}>Inventario</strong>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Saldo actual (no cambia con el período elegido).</p>
      <div style={{ display: "flex", gap: 16, marginTop: 8, marginBottom: 12 }}>
        <KpiCard etiqueta="Productos en negativo" valor={enNegativo.length} alerta={enNegativo.length > 0} />
      </div>
      {enNegativo.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {enNegativo.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td style={{ color: "crimson", fontWeight: 600 }}>{p.stock_actual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function BloqueCompras({ compras, comprasDetalle, periodo }) {
  const resumen = resumenCompras(compras, comprasDetalle, { desde: periodo.desde, hasta: periodo.hasta });
  return (
    <section>
      <strong style={{ fontSize: 14 }}>Compras</strong>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Período: {periodo.etiqueta}</p>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        <KpiCard etiqueta="Compras" valor={resumen.cantidad} />
        <KpiCard etiqueta="Total comprado" valor={formatoMoneda(resumen.total)} />
      </div>
    </section>
  );
}

function BloqueFlujoCaja({ pagos, periodo }) {
  const flujo = resumenFlujoCaja(pagos, { desde: periodo.desde, hasta: periodo.hasta });
  return (
    <section>
      <strong style={{ fontSize: 14 }}>Flujo de caja</strong>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
        Cobros y pagos reales del período ({periodo.etiqueta}) — no cartera pendiente.
      </p>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        <KpiCard etiqueta="Cobros" valor={formatoMoneda(flujo.cobros)} />
        <KpiCard etiqueta="Pagos" valor={formatoMoneda(flujo.pagos)} />
        <KpiCard etiqueta="Flujo neto" valor={formatoMoneda(flujo.neto)} alerta={flujo.neto < 0} />
      </div>
    </section>
  );
}

function BloqueCartera({ cxc, cxp, ventas, vendedorId }) {
  const resumenCxc = cxc && resumenCartera(cxc, { ventas, vendedorId });
  const resumenCxp = cxp && resumenCartera(cxp);
  const porVencerCxp = cxp && porVencerEnDias(cxp, 7);

  return (
    <section>
      <strong style={{ fontSize: 14 }}>{vendedorId ? "Mi cartera" : "Cartera"}</strong>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Saldo actual (no cambia con el período elegido).</p>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        {resumenCxc && (
          <>
            <KpiCard etiqueta="CxC total" valor={formatoMoneda(resumenCxc.total)} />
            <KpiCard etiqueta="CxC vencida" valor={formatoMoneda(resumenCxc.vencido)} alerta={resumenCxc.vencido > 0} />
          </>
        )}
        {resumenCxp && (
          <>
            <KpiCard etiqueta="CxP total" valor={formatoMoneda(resumenCxp.total)} />
            <KpiCard etiqueta="CxP vencida" valor={formatoMoneda(resumenCxp.vencido)} alerta={resumenCxp.vencido > 0} />
            <KpiCard etiqueta="Por vencer en 7 días" valor={porVencerCxp.length} alerta={porVencerCxp.length > 0} />
          </>
        )}
      </div>
    </section>
  );
}
