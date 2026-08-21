import { Link, Outlet } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function PublicLayout() {
  const { items } = useCart();
  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div>
      <header style={{ borderBottom: "1px solid var(--color-borde)" }}>
        <div
          className="contenedor"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}
        >
          <Link to="/" style={{ fontWeight: 700, fontSize: 18, textDecoration: "none" }}>
            Catálogo
          </Link>
          <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              Inicio
            </Link>
            <Link to="/catalogo" style={{ textDecoration: "none" }}>
              Catálogo
            </Link>
            <Link to="/carrito" style={{ textDecoration: "none" }}>
              Carrito {cantidadTotal > 0 ? `(${cantidadTotal})` : ""}
            </Link>
            <Link to="/panel/login" style={{ textDecoration: "none", fontSize: 13, opacity: 0.7 }}>
              Panel interno
            </Link>
          </nav>
        </div>
      </header>
      <main className="contenedor" style={{ paddingTop: 24, paddingBottom: 48, minHeight: "60vh" }}>
        <Outlet />
      </main>
      <footer style={{ borderTop: "1px solid var(--color-borde)", padding: "20px 0", fontSize: 13, opacity: 0.7 }}>
        <div className="contenedor">Catálogo digital — JCS Emprende</div>
      </footer>
    </div>
  );
}
