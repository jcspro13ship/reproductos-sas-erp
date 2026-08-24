import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEmpresa } from "../context/EmpresaContext";
import { resolverImagenDrive } from "../lib/imagenDrive";

export const MODULOS_PANEL = [
  { path: "/panel", label: "Tablero de control", modulo: "tablero" },
  { path: "/panel/ventas", label: "Ventas y cotizaciones", modulo: "ventas" },
  { path: "/panel/compras", label: "Compras", modulo: "compras" },
  { path: "/panel/inventario", label: "Inventario", modulo: "inventario" },
  { path: "/panel/clientes", label: "Clientes", modulo: "ventas" },
  { path: "/panel/proveedores", label: "Proveedores", modulo: "compras" },
  { path: "/panel/comisiones", label: "Comisiones", modulo: "comisiones" },
  { path: "/panel/cartera", label: "Cartera (CxC / CxP)", modulo: ["cxc", "cxp"] },
  { path: "/panel/catalogo-precios", label: "Catálogo y precios", modulo: "catalogo" },
  { path: "/panel/costos", label: "Costos y rentabilidad", modulo: "costos" },
  { path: "/panel/configuracion", label: "Configuración", modulo: "configuracion" },
];

export default function PanelLayout() {
  const { sesion, logout, hasAccess } = useAuth();
  const { empresa } = useEmpresa();
  const logoUrl = resolverImagenDrive(empresa?.logo_url);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/panel/login");
  }

  const visibles = MODULOS_PANEL.filter((m) =>
    Array.isArray(m.modulo) ? m.modulo.some((mod) => hasAccess(mod, "ver")) : hasAccess(m.modulo, "ver")
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 240,
          borderRight: "1px solid var(--color-borde)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 16 }}>
          {logoUrl && <img src={logoUrl} alt="" style={{ height: 28, width: "auto" }} />}
          {empresa?.nombre || "Panel ERP"}
        </div>
        {visibles.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            style={{ padding: "8px 10px", borderRadius: 6, textDecoration: "none", fontSize: 14 }}
          >
            {m.label}
          </Link>
        ))}
        <Link
          to="/catalogo"
          target="_blank"
          rel="noopener"
          style={{ padding: "8px 10px", borderRadius: 6, textDecoration: "none", fontSize: 14, opacity: 0.75 }}
        >
          Ver catálogo público ↗
        </Link>
        <div style={{ marginTop: "auto", fontSize: 13, opacity: 0.8 }}>
          <div>{sesion?.usuario?.nombre}</div>
          <button className="boton-secundario boton" style={{ marginTop: 8, width: "100%" }} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </div>
    </div>
  );
}
