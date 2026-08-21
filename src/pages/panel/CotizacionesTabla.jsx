import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function CotizacionesTabla({ onConvertida }) {
  const { sesion } = useAuth();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [convirtiendoId, setConvirtiendoId] = useState(null);
  const [error, setError] = useState(null);

  function cargar() {
    setCargando(true);
    Promise.all([api.list("COTIZACIONES"), api.list("COTIZACIONES_DETALLE"), api.list("CLIENTES")])
      .then(([c, d, cl]) => {
        setCotizaciones(c);
        setDetalle(d);
        setClientes(cl);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function convertir(cotizacion) {
    setConvirtiendoId(cotizacion.id);
    setError(null);
    try {
      const items = detalle
        .filter((d) => d.cotizacion_id === cotizacion.id)
        .map((d) => ({ producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.precio_unitario }));
      await api.registrarVenta({
        cliente_id: cotizacion.cliente_id,
        vendedor_id: sesion?.usuario?.id || "",
        fecha: cotizacion.fecha,
        items,
      });
      await api.update("COTIZACIONES", cotizacion.id, { estado: "convertida" });
      cargar();
      onConvertida?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setConvirtiendoId(null);
    }
  }

  return (
    <section>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Cotizaciones</h1>
      {cargando && <p>Cargando...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!cargando && !error && cotizaciones.length === 0 && <p>No hay cotizaciones todavía.</p>}
      {!cargando && !error && cotizaciones.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{clientes.find((cl) => cl.id === c.cliente_id)?.nombre || c.cliente_id}</td>
                <td>{c.fecha}</td>
                <td>{c.estado}</td>
                <td>
                  {c.estado === "pendiente" && (
                    <button
                      className="boton-secundario boton"
                      disabled={convirtiendoId === c.id}
                      onClick={() => convertir(c)}
                    >
                      {convirtiendoId === c.id ? "Convirtiendo..." : "Convertir a venta"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
