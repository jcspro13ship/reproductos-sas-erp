import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import { WHATSAPP_NUMERO } from "../../config";

export default function Carrito() {
  const { items, actualizarCantidad, quitar, vaciar, total } = useCart();
  const { cliente } = useClienteAuth();
  const [nombre, setNombre] = useState(cliente?.nombre || "");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  function enviarPedido() {
    setError(null);
    if (!nombre.trim()) {
      setError("Escribe tu nombre para poder enviar el pedido");
      return;
    }
    if (!correo.trim() && !telefono.trim()) {
      setError("Déjanos al menos un correo o un teléfono de contacto");
      return;
    }
    setEnviando(true);
    const lineas = items.map((i) => `- ${i.producto.nombre} x${i.cantidad}`).join("%0A");
    const datosContacto = [`Nombre: ${nombre}`, correo && `Correo: ${correo}`, telefono && `Teléfono: ${telefono}`]
      .filter(Boolean)
      .join("%0A");
    const mensaje = `Hola, quiero hacer un pedido:%0A${lineas}%0A%0ATotal aprox: $${total.toLocaleString("es-CO")}%0A%0A${datosContacto}`;
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${mensaje}`, "_blank");
    vaciar();
    setEnviando(false);
  }

  if (items.length === 0)
    return (
      <div>
        <p>Tu carrito está vacío.</p>
        <Link to="/catalogo" className="boton" style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}>
          Ver catálogo
        </Link>
      </div>
    );

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

      <Link to="/catalogo" style={{ display: "inline-block", marginBottom: 20, fontSize: 13 }}>
        ← Seguir viendo productos
      </Link>

      <div style={{ maxWidth: 360, display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <strong style={{ fontSize: 14 }}>Tus datos de contacto</strong>
        <label>
          Nombre *
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
        </label>
        <label>
          Correo
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tu@correo.com" />
        </label>
        <label>
          Teléfono
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="300 000 0000" />
        </label>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button className="boton" disabled={enviando} onClick={enviarPedido}>
        {enviando ? "Enviando..." : "Enviar pedido por WhatsApp"}
      </button>
    </div>
  );
}
