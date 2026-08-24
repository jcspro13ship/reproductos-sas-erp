import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../lib/api";
import { fusionarPrecios, resolverListaPublica } from "../../lib/catalogo";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import { useCart } from "../../context/CartContext";
import { resolverImagenDrive } from "../../lib/imagenDrive";
import { compartirProducto } from "../../lib/compartir";

export default function ProductoDetalle() {
  const { id } = useParams();
  const { cliente } = useClienteAuth();
  const { agregar } = useCart();
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [agregado, setAgregado] = useState(false);

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

  const imagenUrl = resolverImagenDrive(producto.imagen);

  function handleAgregar() {
    agregar(producto, cantidad);
    setAgregado(true);
  }

  return (
    <div>
      <Link to="/catalogo" style={{ display: "inline-block", marginBottom: 16, fontSize: 13 }}>
        ← Volver al catálogo
      </Link>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div style={{ aspectRatio: "1 / 1", background: "#f4f4f4", borderRadius: "var(--radio)" }}>
          {imagenUrl && (
            <img src={imagenUrl} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radio)" }} />
          )}
        </div>
        <div>
          <h1 style={{ fontSize: 24 }}>{producto.nombre}</h1>
          <p style={{ fontSize: 20, fontWeight: 600, margin: "12px 0" }}>
            {producto.precio != null ? `$${Number(producto.precio).toLocaleString("es-CO")}` : "Consultar precio"}
          </p>
          {producto.descripcion && (
            <p style={{ fontSize: 14, opacity: 0.8, margin: "12px 0" }}>{producto.descripcion}</p>
          )}
          <p style={{ fontSize: 13 }}>
            {Number(producto.stock_actual) > 0 ? (
              <span style={{ color: "var(--color-primario)" }}>Disponible ({producto.stock_actual} en stock)</span>
            ) : (
              <span style={{ opacity: 0.6 }}>Sin stock — disponible para pedido especial</span>
            )}
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
            <button className="boton-secundario boton" onClick={() => compartirProducto(producto)}>
              Compartir por WhatsApp
            </button>
          </div>
          {agregado && (
            <div style={{ padding: 12, borderRadius: "var(--radio)", background: "#f4f4f4", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 13 }}>Agregado al carrito ✓</span>
              <Link to="/catalogo" className="boton-secundario boton" style={{ textDecoration: "none" }}>
                Seguir viendo productos
              </Link>
              <Link to="/carrito" className="boton" style={{ textDecoration: "none" }}>
                Ver carrito
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
