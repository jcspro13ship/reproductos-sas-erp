import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { parseDDMMAAAA } from "../../lib/fecha";
import { formatoMoneda } from "../../lib/formato";

function mesDeFecha(fechaDDMMAAAA) {
  const fecha = parseDDMMAAAA(fechaDDMMAAAA);
  if (!fecha) return "";
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

export default function Comisiones() {
  const [comisiones, setComisiones] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mes, setMes] = useState("");
  const [vendedorId, setVendedorId] = useState("");

  useEffect(() => {
    Promise.all([api.list("COMISIONES"), api.list("VENTAS"), api.list("USUARIOS")])
      .then(([c, v, u]) => {
        setComisiones(c);
        setVentas(v);
        setUsuarios(u);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  function nombreVendedor(vendedorId) {
    return usuarios.find((u) => String(u.id) === String(vendedorId))?.nombre || vendedorId || "Sin asignar";
  }

  const filas = useMemo(() => {
    return comisiones.map((c) => {
      const venta = ventas.find((v) => String(v.id) === String(c.venta_id));
      return { ...c, fecha: venta?.fecha || "", mes: mesDeFecha(venta?.fecha) };
    });
  }, [comisiones, ventas]);

  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      if (mes && f.mes !== mes) return false;
      if (vendedorId && String(f.vendedor_id) !== String(vendedorId)) return false;
      return true;
    });
  }, [filas, mes, vendedorId]);

  const vendedoresConComision = useMemo(() => {
    const ids = new Set(comisiones.map((c) => String(c.vendedor_id)));
    return usuarios.filter((u) => ids.has(String(u.id)));
  }, [comisiones, usuarios]);

  const totalPeriodo = filasFiltradas.reduce((s, f) => s + (Number(f.valor_comision) || 0), 0);

  const porVendedor = useMemo(() => {
    const mapa = new Map();
    filasFiltradas.forEach((f) => {
      const clave = String(f.vendedor_id);
      mapa.set(clave, (mapa.get(clave) || 0) + (Number(f.valor_comision) || 0));
    });
    return Array.from(mapa.entries())
      .map(([id, total]) => ({ vendedorId: id, nombre: nombreVendedor(id), total }))
      .sort((a, b) => b.total - a.total);
  }, [filasFiltradas, usuarios]);

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 20 }}>Comisiones</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12 }}>
            Mes
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
          </label>
          <label style={{ fontSize: 12 }}>
            Vendedor
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
              <option value="">Todos</option>
              {vendedoresConComision.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {cargando && <p>Cargando...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!cargando && !error && (
        <>
          {!vendedorId && porVendedor.length > 1 && (
            <div style={{ marginBottom: 16, padding: 12, borderRadius: "var(--radio)", background: "#f4f4f4" }}>
              <strong style={{ fontSize: 13 }}>Total por vendedor{mes ? ` — ${mes}` : ""}</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>
                {porVendedor.map((v) => (
                  <li key={v.vendedorId}>
                    {v.nombre}: {formatoMoneda(v.total)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {filasFiltradas.length === 0 && <p>No hay comisiones para este filtro.</p>}
          {filasFiltradas.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Venta</th>
                  <th>Vendedor</th>
                  <th>Valor</th>
                  <th>Estado de pago</th>
                </tr>
              </thead>
              <tbody>
                {filasFiltradas.map((f, i) => (
                  <tr key={f.venta_id || i}>
                    <td>{f.fecha}</td>
                    <td>{f.venta_id}</td>
                    <td>{nombreVendedor(f.vendedor_id)}</td>
                    <td>{formatoMoneda(f.valor_comision)}</td>
                    <td>{f.estado_pago}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", fontWeight: 600 }}>
                    Total{mes ? ` (${mes})` : ""}
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatoMoneda(totalPeriodo)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </>
      )}
    </section>
  );
}
