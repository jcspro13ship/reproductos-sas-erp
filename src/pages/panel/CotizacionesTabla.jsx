import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function CotizacionesTabla({ onConvertida, onVerImprimir }) {
  const { sesion } = useAuth();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [listas, setListas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [convirtiendoId, setConvirtiendoId] = useState(null);
  const [error, setError] = useState(null);

  function cargar() {
    setCargando(true);
    Promise.all([
      api.list("COTIZACIONES"),
      api.list("COTIZACIONES_DETALLE"),
      api.list("CLIENTES"),
      api.list("PRODUCTOS"),
      api.list("LISTAS_PRECIO"),
    ])
      .then(([c, d, cl, p, l]) => {
        setCotizaciones(c);
        setDetalle(d);
        setClientes(cl);
        setProductos(p);
        setListas(l);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function clienteDe(cotizacion) {
    return clientes.find((cl) => String(cl.id) === String(cotizacion.cliente_id));
  }

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

  function verImprimir(cotizacion) {
    const items = detalle
      .filter((d) => d.cotizacion_id === cotizacion.id)
      .map((d) => ({ ...d, producto: productos.find((p) => String(p.id) === String(d.producto_id)) }));
    onVerImprimir?.({
      cotizacion,
      cliente: clienteDe(cotizacion),
      lista: listas.find((l) => String(l.id) === String(cotizacion.lista_precio_id)),
      notas: cotizacion.notas,
      items,
    });
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
                <td>{clienteDe(c)?.nombre || c.cliente_id}</td>
                <td>{c.fecha}</td>
                <td>{c.estado}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="boton-secundario boton" onClick={() => verImprimir(c)}>
                    Ver / Imprimir
                  </button>
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
