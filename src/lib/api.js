import { API_URL } from "../config";

async function request(params) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL no está configurada. Define la URL del Web App de Apps Script en .env.local"
    );
  }
  const url = new URL(API_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const res = await fetch(url.toString());
  const body = await res.json();
  if (!body.ok) throw new Error(body.error || "Error de API");
  return body.data;
}

async function send(action, sheet, payload = {}) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL no está configurada. Define la URL del Web App de Apps Script en .env.local"
    );
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, sheet, ...payload }),
  });
  const body = await res.json();
  if (!body.ok) throw new Error(body.error || "Error de API");
  return body.data;
}

export const api = {
  list: (sheet) => request({ action: "list", sheet }),
  get: (sheet, id) => request({ action: "get", sheet, id }),
  create: (sheet, data) => send("create", sheet, { data }),
  update: (sheet, id, data) => send("update", sheet, { id, data }),
  remove: (sheet, id) => send("delete", sheet, { id }),
  login: (email) => send("login", "USUARIOS", { email }),
  loginCliente: (usuario, clave) => send("loginCliente", "CLIENTES", { usuario, clave }),
  recibirCompra: (data) => send("recibirCompra", undefined, { data }),
  registrarVenta: (data) => send("registrarVenta", undefined, { data }),
};
