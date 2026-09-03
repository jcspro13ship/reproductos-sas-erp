import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { parseDDMMAAAA, hoyDDMMAAAA } from "../../lib/fecha";
import { formatoMoneda } from "../../lib/formato";
import { useEmpresa } from "../../context/EmpresaContext";
import LiquidacionComisionImprimible from "../../components/LiquidacionComisionImprimible";

function mesDeFecha(fechaDDMMAAAA) {
  const fecha = parseDDMMAAAA(fechaDDMMAAAA);
  if (!fecha) return "";
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

export default function Comisiones() {
  const { empresa } = useEmpresa();
  const [comisiones, setComisiones] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mes, setMes] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [marcando, setMarcando] = useState(null);
  const [liquidacion, setLiquidacion] = useState(null);

  useEffect(() => {
    Promise.all([api.list("COMISIONES"), api.list("VENTAS"), api.list("USUARIOS"), api.list("CLIENTES")])
      .then(([c, v, u, cl]) => {
        setComisiones(c);
        setVentas(v);
        setUsuarios(u);
        setClientes(cl);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  function nombreVendedor(vendedorId) {
    return usuarios.find((u) => String(u.id) === String(vendedorId))?.nombre || vendedorId || "Sin asignar";
  }

  function nombreCliente(clienteId) {
    return clientes.find((c) => String(c.id) === String(clienteId))?.nombre || "";
  }

  async function marcarPagada(ventaId) {
    setMarcando(ventaId);
    setError(null);
    try {
      await api.marcarComisionPagada(ventaId);
      setComisiones((cs) => cs.map((c) => (String(c.venta_id) === String(ventaId) ? { ...c, estado_pago: "pagada" } : c)));
    } catch (e) {
      setError(e.message);
    } finally {
      setMarcando(null);
    }
  }

  const filas = useMemo(() => {
    return comisiones.map((c) => {
      const venta = ventas.find((v) => String(v.id) === String(c.venta_id));
      return { ...c, fecha: venta?.fecha || "", mes: mesDeFecha(venta?.fecha), clienteId: venta?.cliente_id };
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

  // La liquidación siempre se arma solo con comisiones pendientes (lo que
  // falta por pagar), sin importar qué esté mostrando la tabla en pantalla —
  // no tendría sentido imprimir un pago por algo que ya se pagó.
  function imprimirLiquidacion(idVendedor) {
    const items = filas.filter((f) => {
      if (String(f.vendedor_id) !== String(idVendedor)) return false;
      if (f.estado_pago === "pagada") return false;
      if (mes && f.mes !== mes) return false;
      return true;
    });
    if (items.length === 0) return;
    setLiquidacion({
      vendedor: usuarios.find((u) => String(u.id) === String(idVendedor)),
      periodoEtiqueta: mes || "",
      items: items.map((i) => ({ ...i, clienteNombre: nombreCliente(i.clienteId) })),
    });
    setTimeout(() => window.print(), 300);
  }

  return (
    <div>
      <div className="no-print">
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
                <ul style={{ margin: "8px 0 0", fontSize: 13, listStyle: "none", paddingLeft: 0 }}>
                  {porVendedor.map((v) => (
                    <li key={v.vendedorId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                      <span style={{ flex: 1 }}>
                        {v.nombre}: {formatoMoneda(v.total)}
                      </span>
                      <button className="boton-secundario boton" onClick={() => imprimirLiquidacion(v.vendedorId)}>
                        Imprimir liquidación
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {vendedorId && (
              <div style={{ marginBottom: 16 }}>
                <button className="boton" onClick={() => imprimirLiquidacion(vendedorId)}>
                  Imprimir liquidación de {nombreVendedor(vendedorId)}
                </button>
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
                    <th></th>
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
                      <td>
                        {f.estado_pago !== "pagada" && (
                          <button
                            className="boton-secundario boton"
                            disabled={marcando === f.venta_id}
                            onClick={() => marcarPagada(f.venta_id)}
                          >
                            {marcando === f.venta_id ? "Guardando..." : "Marcar como pagada"}
                          </button>
                        )}
                      </td>
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
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </>
        )}
      </div>

      {liquidacion && (
        <LiquidacionComisionImprimible
          empresa={empresa}
          vendedor={liquidacion.vendedor}
          periodoEtiqueta={liquidacion.periodoEtiqueta}
          fechaEmision={hoyDDMMAAAA()}
          items={liquidacion.items}
        />
      )}
    </div>
  );
}
