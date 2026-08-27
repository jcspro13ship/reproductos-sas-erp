import { Link } from "react-router-dom";
import { resolverImagenDrive } from "../lib/imagenDrive";
import { compartirProducto } from "../lib/compartir";

export default function ProductoCard({ producto }) {
  const imagenUrl = resolverImagenDrive(producto.imagen);
  return (
    <Link
      to={`/producto/${producto.id}`}
      style={{
        display: "block",
        position: "relative",
        textDecoration: "none",
        color: "inherit",
        border: "1px solid var(--color-borde)",
        borderRadius: "var(--radio)",
        overflow: "hidden",
      }}
    >
      <div style={{ aspectRatio: "1 / 1", background: "#f4f4f4" }}>
        {imagenUrl && (
          <img
            src={imagenUrl}
            alt={producto.nombre}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          compartirProducto(producto);
        }}
        title="Compartir por WhatsApp"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        ↗
      </button>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{producto.nombre}</div>
        <div style={{ fontSize: 14, marginTop: 4 }}>
          {producto.precio != null ? `$${Number(producto.precio).toLocaleString("es-CO")}` : ""}
        </div>
      </div>
    </Link>
  );
}
