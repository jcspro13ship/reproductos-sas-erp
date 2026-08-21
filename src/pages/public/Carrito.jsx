import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import { api } from "../../lib/api";
import { WHATSAPP_NUMERO } from "../../config";
import { hoyDDMMAAAA } from "../../lib/fecha";

export default function Carrito() {
  const { items, actualizarCantidad, quitar, vaciar, total } = useCart();
  const { cliente } = useClienteAuth();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function enviarCotizacion() {
    setEnviando(true);
    setError(null);
    try {
      const cotizacion = await api.create("COTIZACIONES", {
        cliente_id: cliente?.id || "",
        fecha: hoyDDMMAAAA(),
        estado: "pendiente",
      });
      await Promise.all(
        items.map((i) =>
          api.create("COTIZACIONES_DETALLE", {
            cotizacion_id: cotizacion.id,
            producto_id: i.producto.id,
            cantidad: i.cantidad,
            precio_unitario: i.producto.precio,
          })
        )
      );

      const lineas = items.map((i) => `- ${i.producto.nombre} x${i.cantidad}`).join("%0A");
      const mensaje = `Hola, quiero cotizar:%0A${lineas}%0A%0ATotal aprox: $${total.toLocaleString("es-CO")}%0ACotización #${cotizacion.id}`;
      window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${mensaje}`, "_blank");
      vaciar();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (items.length === 0) return <p>Tu carrito está vacío.</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Carrito</h1>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.producto.id}>
              <td>{i.producto.nombre}</td>
              <td>${Number(i.producto.precio || 0).toLocaleString("es-CO")}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={i.cantidad}
                  onChange={(e) => actualizarCantidad(i.producto.id, Number(e.target.value))}
                  style={{ width: 60 }}
                />
              </td>
              <td>${(i.producto.precio * i.cantidad).toLocaleString("es-CO")}</td>
              <td>
                <button className="boton-secundario boton" onClick={() => quitar(i.producto.id)}>
                  Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 18, fontWeight: 600, marginTop: 16 }}>
        Total: ${total.toLocaleString("es-CO")}
      </p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button className="boton" disabled={enviando} onClick={enviarCotizacion}>
        {enviando ? "Enviando..." : "Enviar cotización por WhatsApp"}
      </button>
    </div>
  );
}
