import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { fusionarPrecios, resolverListaPublica } from "../../lib/catalogo";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import { useCart } from "../../context/CartContext";

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cliente } = useClienteAuth();
  const { agregar } = useCart();
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([api.list("PRODUCTOS"), api.list("PRECIOS_PRODUCTO"), api.list("LISTAS_PRECIO")])
      .then(([productos, precios, listas]) => {
        if (!activo) return;
        const listaId = cliente?.lista_precio_id || resolverListaPublica(listas)?.id;
        const [encontrado] = fusionarPrecios(
          productos.filter((p) => String(p.id) === id),
          precios,
          listaId
        );
        setProducto(encontrado || null);
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [id, cliente]);

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!producto) return <p>Producto no encontrado.</p>;

  function handleAgregar() {
    agregar(producto, cantidad);
    navigate("/carrito");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <div style={{ aspectRatio: "1 / 1", background: "#f4f4f4", borderRadius: "var(--radio)" }}>
        {producto.imagen && (
          <img src={producto.imagen} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radio)" }} />
        )}
      </div>
      <div>
        <h1 style={{ fontSize: 24 }}>{producto.nombre}</h1>
        <p style={{ fontSize: 20, fontWeight: 600, margin: "12px 0" }}>
          {producto.precio != null ? `$${Number(producto.precio).toLocaleString("es-CO")}` : "Consultar precio"}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "16px 0" }}>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
            style={{ width: 70 }}
          />
          <button className="boton" onClick={handleAgregar}>
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
