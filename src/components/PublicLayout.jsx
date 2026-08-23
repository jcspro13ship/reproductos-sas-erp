import { Link, Outlet, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useClienteAuth } from "../context/ClienteAuthContext";
import { useEmpresa } from "../context/EmpresaContext";
import { resolverLogoUrl } from "../lib/logo";

export default function PublicLayout() {
  const { items } = useCart();
  const { cliente, logout } = useClienteAuth();
  const { empresa } = useEmpresa();
  const logoUrl = resolverLogoUrl(empresa?.logo_url);
  const navigate = useNavigate();
  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);

  function handleLogout() {
    logout();
    navigate("/catalogo");
  }

  return (
    <div>
      <header style={{ borderBottom: "1px solid var(--color-borde)" }}>
        <div
          className="contenedor"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}
        >
          <Link
            to="/"
            style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 18, textDecoration: "none" }}
          >
            {logoUrl && <img src={logoUrl} alt="" style={{ height: 32, width: "auto" }} />}
            {empresa?.nombre || "Catálogo"}
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
            {cliente ? (
              <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                Hola, {cliente.nombre}
                <button className="boton-secundario boton" onClick={handleLogout}>
                  Salir
                </button>
              </span>
            ) : (
              <Link to="/ingresar" style={{ textDecoration: "none", fontSize: 13 }}>
                Ingresar
              </Link>
            )}
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
