import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ClienteAuthProvider } from "./context/ClienteAuthContext";
import { CartProvider } from "./context/CartContext";
import PublicLayout from "./components/PublicLayout";
import PanelLayout from "./components/PanelLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Inicio from "./pages/public/Inicio";
import Catalogo from "./pages/public/Catalogo";
import ProductoDetalle from "./pages/public/ProductoDetalle";
import Carrito from "./pages/public/Carrito";

import Login from "./pages/panel/Login";
import Dashboard from "./pages/panel/Dashboard";
import Compras from "./pages/panel/Compras";
import Inventario from "./pages/panel/Inventario";
import Ventas from "./pages/panel/Ventas";
import Clientes from "./pages/panel/Clientes";
import Proveedores from "./pages/panel/Proveedores";
import Comisiones from "./pages/panel/Comisiones";
import Cartera from "./pages/panel/Cartera";
import CatalogoPrecios from "./pages/panel/CatalogoPrecios";
import Costos from "./pages/panel/Costos";
import Configuracion from "./pages/panel/Configuracion";
import Onboarding from "./pages/onboarding/Onboarding";

export default function App() {
  return (
    <AuthProvider>
      <ClienteAuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Inicio />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/producto/:id" element={<ProductoDetalle />} />
              <Route path="/carrito" element={<Carrito />} />
            </Route>

            <Route path="/panel/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              path="/panel"
              element={
                <ProtectedRoute>
                  <PanelLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="compras" element={<Compras />} />
              <Route path="inventario" element={<Inventario />} />
              <Route path="ventas" element={<Ventas />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="proveedores" element={<Proveedores />} />
              <Route path="comisiones" element={<Comisiones />} />
              <Route path="cartera" element={<Cartera />} />
              <Route path="catalogo-precios" element={<CatalogoPrecios />} />
              <Route path="costos" element={<Costos />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>
          </Routes>
        </CartProvider>
      </ClienteAuthProvider>
    </AuthProvider>
  );
}
