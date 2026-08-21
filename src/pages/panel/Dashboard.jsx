import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { formatoMoneda } from "../../lib/formato";
import { comisionPendiente, porVencerEnDias, productosEnNegativo, resumenCartera, ventasDelMes } from "../../lib/tablero";
import KpiCard from "../../components/KpiCard";

export default function Dashboard() {
  const { sesion, hasAccess } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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
    ])
      .then(([productos, ventas, ventasDetalle, compras, comprasDetalle, comisiones, cxc, cxp]) => {
        setDatos({ productos, ventas, ventasDetalle, compras, comprasDetalle, comisiones, cxc, cxp });
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

  const { productos, ventas, ventasDetalle, compras, comprasDetalle, comisiones, cxc, cxp } = datos;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Tablero de control</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>Hola {sesion?.usuario?.nombre}.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {hasAccess("ventas", "ver") && (
          <BloqueVentas
            ventas={ventas}
            ventasDetalle={ventasDetalle}
            comisiones={comisiones}
            usuarioId={usuarioId}
            soloPropias={soloMisVentas}
          />
        )}

        {hasAccess("inventario", "ver") && <BloqueInventario productos={productos} />}

        {hasAccess("compras", "ver") && <BloqueCompras compras={compras} comprasDetalle={comprasDetalle} />}

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

function BloqueVentas({ ventas, ventasDetalle, comisiones, usuarioId, soloPropias }) {
  const resumen = ventasDelMes(ventas, ventasDetalle, { vendedorId: soloPropias ? usuarioId : undefined });
  return (
    <section>
      <strong style={{ fontSize: 14 }}>{soloPropias ? "Mi desempeño" : "Ventas"}</strong>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        <KpiCard etiqueta={soloPropias ? "Mis ventas del mes" : "Ventas del mes"} valor={resumen.cantidad} />
        <KpiCard etiqueta="Total vendido este mes" valor={formatoMoneda(resumen.total)} />
        {soloPropias && (
          <KpiCard etiqueta="Mi comisión pendiente" valor={formatoMoneda(comisionPendiente(comisiones, usuarioId))} />
        )}
      </div>
    </section>
  );
}

function BloqueInventario({ productos }) {
  const enNegativo = productosEnNegativo(productos);
  return (
    <section>
      <strong style={{ fontSize: 14 }}>Inventario</strong>
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

function BloqueCompras({ compras, comprasDetalle }) {
  const hoy = new Date();
  const delMes = compras.filter((c) => {
    const [dd, mm, aaaa] = String(c.fecha || "").split("-").map(Number);
    return mm - 1 === hoy.getMonth() && aaaa === hoy.getFullYear();
  });
  const ids = new Set(delMes.map((c) => c.id));
  const total = comprasDetalle
    .filter((d) => ids.has(d.compra_id))
    .reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.costo_unitario) || 0), 0);

  return (
    <section>
      <strong style={{ fontSize: 14 }}>Compras</strong>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        <KpiCard etiqueta="Compras del mes" valor={delMes.length} />
        <KpiCard etiqueta="Total comprado este mes" valor={formatoMoneda(total)} />
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
