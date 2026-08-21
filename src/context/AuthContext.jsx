import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const NIVELES = { ninguno: 0, ver: 1, editar: 2, total: 3 };
const STORAGE_KEY = "erp_panel_sesion";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sesion) localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
    else localStorage.removeItem(STORAGE_KEY);
  }, [sesion]);

  async function login(email) {
    setCargando(true);
    setError(null);
    try {
      const data = await api.login(email);
      setSesion(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setCargando(false);
    }
  }

  function logout() {
    setSesion(null);
  }

  function hasAccess(modulo, nivelMinimo = "ver") {
    if (!sesion) return false;
    const permiso = sesion.permisos?.find((p) => p.modulo === modulo);
    const nivelActual = NIVELES[permiso?.nivel_acceso || "ninguno"];
    return nivelActual >= NIVELES[nivelMinimo];
  }

  return (
    <AuthContext.Provider value={{ sesion, cargando, error, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
