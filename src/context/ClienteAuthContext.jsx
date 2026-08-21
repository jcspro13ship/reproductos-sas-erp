import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const STORAGE_KEY = "erp_catalogo_cliente";

const ClienteAuthContext = createContext(null);

export function ClienteAuthProvider({ children }) {
  const [cliente, setCliente] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cliente) localStorage.setItem(STORAGE_KEY, JSON.stringify(cliente));
    else localStorage.removeItem(STORAGE_KEY);
  }, [cliente]);

  async function login(usuario, clave) {
    setError(null);
    try {
      const data = await api.loginCliente(usuario, clave);
      setCliente(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }

  function logout() {
    setCliente(null);
  }

  return (
    <ClienteAuthContext.Provider value={{ cliente, error, login, logout }}>
      {children}
    </ClienteAuthContext.Provider>
  );
}

export function useClienteAuth() {
  const ctx = useContext(ClienteAuthContext);
  if (!ctx) throw new Error("useClienteAuth debe usarse dentro de ClienteAuthProvider");
  return ctx;
}
