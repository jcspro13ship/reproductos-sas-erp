import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function VentasTabla({ onVerImprimir }) {
  const [ventas, setVentas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  function cargar() {
    setCargando(true);
    Promise.all([
      api.list("VENTAS"),
      api.list("VENTAS_DETALLE"),
      api.list("CLIENTES"),
      api.list("USUARIOS"),
      api.list("PRODUCTOS"),
    ])
      .then(([v, d, cl, u, p]) => {
        setVentas(v);
        setDetalle(d);
        setClientes(cl);
        setUsuarios(u);
        setProductos(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function clienteDe(venta) {
    return clientes.find((c) => String(c.id) === String(venta.cliente_id));
  }

  function vendedorDe(venta) {
    return usuarios.find((u) => String(u.id) === String(venta.vendedor_id));
  }

  function verImprimir(venta) {
    const items = detalle
      .filter((d) => String(d.venta_id) === String(venta.id))
      .map((d) => ({ ...d, producto: productos.find((p) => String(p.id) === String(d.producto_id)) }));
    onVerImprimir?.({ venta, cliente: clienteDe(venta), items });
  }

  async function eliminar(venta) {
    if (!window.confirm(`¿Eliminar la venta ${venta.id}? Esto repone el stock y borra su comisión, CxC y pago si lo tenía. No se puede deshacer.`)) {
      return;
    }
    setEliminando(venta.id);
    setError(null);
    try {
      await api.eliminarVenta(venta.id);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setEliminando(null);
    }
  }

  return (
    <section>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Ventas</h1>
      {cargando && <p>Cargando...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!cargando && !error && ventas.length === 0 && <p>No hay ventas todavía.</p>}
      {!cargando && !error && ventas.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>N.°</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Fecha</th>
              <th>N.° factura</th>
              <th>Vence</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{clienteDe(v)?.nombre || v.cliente_id}</td>
                <td>{vendedorDe(v)?.nombre || v.vendedor_id}</td>
                <td>{v.fecha}</td>
                <td>{v.numero_factura}</td>
                <td>{v.fecha_vencimiento}</td>
                <td>{v.estado}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="boton-secundario boton" onClick={() => verImprimir(v)}>
                    Ver / Imprimir
                  </button>
                  <button
                    className="boton-secundario boton"
                    disabled={eliminando === v.id}
                    onClick={() => eliminar(v)}
                  >
                    {eliminando === v.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
