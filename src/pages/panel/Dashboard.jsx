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

// Cada bloque pide sus propios datos y se muestra apenas están listos, en vez
// de esperar a que las 9 hojas del tablero completo hayan llegado antes de
// mostrar cualquier cosa. Si dos bloques piden la misma hoja (ej. PRODUCTOS),
// el caché de api.list la comparte en una sola llamada — ver src/lib/cache.js.
export default function Dashboard() {
  const { sesion, hasAccess } = useAuth();
  const primerPreset = PRESETS_PERIODO[0];
  const [periodo, setPeriodo] = useState(() => {
    const [desde, hasta] = primerPreset.rango();
    return { desde, hasta, etiqueta: primerPreset.etiqueta, presetId: primerPreset.id };
  });

  const usuarioId = sesion?.usuario?.id;
  const esAdmin = hasAccess("configuracion", "total");
  // Un vendedor (a diferencia de Cartera o Compras, que también pueden ver "ventas")
  // no tiene acceso propio a compras ni a CxP — con eso distinguimos su vista acotada
  // a "lo mío" de la vista completa que ven los demás roles con acceso al módulo.
  const soloMisVentas = !esAdmin && hasAccess("ventas", "ver") && !hasAccess("cxp", "ver") && !hasAccess("compras", "ver");

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Tablero de control</h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>Hola {sesion?.usuario?.nombre}.</p>

      <PeriodoSelector presetActivo={periodo.presetId} onCambiar={setPeriodo} />

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {hasAccess("cxc", "ver") && hasAccess("cxp", "ver") && <BloqueFlujoCaja periodo={periodo} />}

        {hasAccess("ventas", "ver") && (
          <BloqueVentas usuarioId={usuarioId} soloPropias={soloMisVentas} periodo={periodo} />
        )}

        {hasAccess("inventario", "ver") && <BloqueInventario />}

        {hasAccess("compras", "ver") && <BloqueCompras periodo={periodo} />}

        {(hasAccess("cxc", "ver") || hasAccess("cxp", "ver")) && (
          <BloqueCartera
            mostrarCxc={hasAccess("cxc", "ver")}
            mostrarCxp={hasAccess("cxp", "ver")}
            vendedorId={soloMisVentas ? usuarioId : null}
          />
        )}
      </div>
    </div>
  );
}

function SeccionCargando({ titulo }) {
  return (
    <section>
      <strong style={{ fontSize: 14 }}>{titulo}</strong>
      <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>Cargando...</p>
    </section>
  );
}

function SeccionError({ titulo, error }) {
  return (
    <section>
      <strong style={{ fontSize: 14 }}>{titulo}</strong>
      <p style={{ fontSize: 13, color: "crimson", marginTop: 8 }}>{error}</p>
    </section>
  );
}

function BloqueVentas({ usuarioId, soloPropias, periodo }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const titulo = soloPropias ? "Mi desempeño" : "Ventas";

  useEffect(() => {
    Promise.all([api.list("VENTAS"), api.list("VENTAS_DETALLE"), api.list("COMISIONES"), api.list("PRODUCTOS")])
      .then(([ventas, ventasDetalle, comisiones, productos]) => setDatos({ ventas, ventasDetalle, comisiones, productos }))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <SeccionError titulo={titulo} error={error} />;
  if (!datos) return <SeccionCargando titulo={titulo} />;

  const vendedorId = soloPropias ? usuarioId : undefined;
  const resumen = resumenVentas(datos.ventas, datos.ventasDetalle, { desde: periodo.desde, hasta: periodo.hasta, vendedorId });
  const porMes = ventasPorPeriodo(datos.ventas, datos.ventasDetalle, { desde: periodo.desde, hasta: periodo.hasta, vendedorId });
  const topProductos = topProductosVendidos(datos.ventas, datos.ventasDetalle, datos.productos, {
    desde: periodo.desde,
    hasta: periodo.hasta,
    vendedorId,
  });

  return (
    <section>
      <strong style={{ fontSize: 14 }}>{titulo}</strong>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Período: {periodo.etiqueta}</p>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        <KpiCard etiqueta={soloPropias ? "Mis ventas" : "Ventas"} valor={resumen.cantidad} />
        <KpiCard etiqueta="Total vendido" valor={formatoMoneda(resumen.total)} />
        {soloPropias && (
          <KpiCard etiqueta="Mi comisión pendiente (todo)" valor={formatoMoneda(comisionPendiente(datos.comisiones, usuarioId))} />
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

function BloqueInventario() {
  const [productos, setProductos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.list("PRODUCTOS").then(setProductos).catch((e) => setError(e.message));
  }, []);

  if (error) return <SeccionError titulo="Inventario" error={error} />;
  if (!productos) return <SeccionCargando titulo="Inventario" />;

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

function BloqueCompras({ periodo }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.list("COMPRAS"), api.list("COMPRAS_DETALLE")])
      .then(([compras, comprasDetalle]) => setDatos({ compras, comprasDetalle }))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <SeccionError titulo="Compras" error={error} />;
  if (!datos) return <SeccionCargando titulo="Compras" />;

  const resumen = resumenCompras(datos.compras, datos.comprasDetalle, { desde: periodo.desde, hasta: periodo.hasta });
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

function BloqueFlujoCaja({ periodo }) {
  const [pagos, setPagos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.list("PAGOS").then(setPagos).catch((e) => setError(e.message));
  }, []);

  if (error) return <SeccionError titulo="Flujo de caja" error={error} />;
  if (!pagos) return <SeccionCargando titulo="Flujo de caja" />;

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

function BloqueCartera({ mostrarCxc, mostrarCxp, vendedorId }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const titulo = vendedorId ? "Mi cartera" : "Cartera";

  useEffect(() => {
    Promise.all([
      mostrarCxc ? api.list("CXC") : Promise.resolve(null),
      mostrarCxp ? api.list("CXP") : Promise.resolve(null),
      mostrarCxc && vendedorId ? api.list("VENTAS") : Promise.resolve(null),
    ])
      .then(([cxc, cxp, ventas]) => setDatos({ cxc, cxp, ventas }))
      .catch((e) => setError(e.message));
  }, [mostrarCxc, mostrarCxp, vendedorId]);

  if (error) return <SeccionError titulo={titulo} error={error} />;
  if (!datos) return <SeccionCargando titulo={titulo} />;

  const resumenCxc = datos.cxc && resumenCartera(datos.cxc, { ventas: datos.ventas, vendedorId });
  const resumenCxp = datos.cxp && resumenCartera(datos.cxp);
  const porVencerCxp = datos.cxp && porVencerEnDias(datos.cxp, 7);

  return (
    <section>
      <strong style={{ fontSize: 14 }}>{titulo}</strong>
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
