import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function ComprasTabla() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  function cargar() {
    setCargando(true);
    Promise.all([api.list("COMPRAS"), api.list("PROVEEDORES")])
      .then(([c, p]) => {
        setCompras(c);
        setProveedores(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function proveedorDe(compra) {
    return proveedores.find((p) => String(p.id) === String(compra.proveedor_id));
  }

  async function eliminar(compra) {
    if (!window.confirm(`¿Eliminar la compra ${compra.id}? Esto descuenta el stock que había agregado y borra su CxP y pago si lo tenía. No se puede deshacer.`)) {
      return;
    }
    setEliminando(compra.id);
    setError(null);
    try {
      await api.eliminarCompra(compra.id);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setEliminando(null);
    }
  }

  return (
    <section>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Compras</h1>
      {cargando && <p>Cargando...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!cargando && !error && compras.length === 0 && <p>No hay compras todavía.</p>}
      {!cargando && !error && compras.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>N.° factura</th>
              <th>Vence</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{proveedorDe(c)?.nombre || c.proveedor_id}</td>
                <td>{c.fecha}</td>
                <td>{c.numero_factura}</td>
                <td>{c.fecha_vencimiento}</td>
                <td>{c.estado}</td>
                <td>
                  <button
                    className="boton-secundario boton"
                    disabled={eliminando === c.id}
                    onClick={() => eliminar(c)}
                  >
                    {eliminando === c.id ? "Eliminando..." : "Eliminar"}
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
