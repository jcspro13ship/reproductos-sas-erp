import { Link } from "react-router-dom";

export default function ProductoCard({ producto }) {
  return (
    <Link
      to={`/producto/${producto.id}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        border: "1px solid var(--color-borde)",
        borderRadius: "var(--radio)",
        overflow: "hidden",
      }}
    >
      <div style={{ aspectRatio: "1 / 1", background: "#f4f4f4" }}>
        {producto.imagen && (
          <img src={producto.imagen} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{producto.nombre}</div>
        <div style={{ fontSize: 14, marginTop: 4 }}>
          {producto.precio != null ? `$${Number(producto.precio).toLocaleString("es-CO")}` : ""}
        </div>
      </div>
    </Link>
  );
}
