import { API_URL } from "../config";

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MENSAJE_SIN_CONEXION = "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo en un momento.";

// Apps Script a veces devuelve una página de error de Google (HTML) en vez de
// la respuesta JSON esperada — casi siempre un tropiezo puntual (el script
// tardó en "despertar", un corte de red breve) — lo que producía el error
// críptico "Unexpected token '<'". Esto lo interpreta y da un mensaje claro.
async function interpretar(res) {
  const texto = await res.text();
  let body;
  try {
    body = JSON.parse(texto);
  } catch {
    throw new Error(MENSAJE_SIN_CONEXION);
  }
  if (!body.ok) throw new Error(body.error || "Error de API");
  return body.data;
}

async function request(params) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL no está configurada. Define la URL del Web App de Apps Script en .env.local"
    );
  }
  const url = new URL(API_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  // list/get no modifican nada, así que si la respuesta no es JSON válido
  // (tropiezo puntual) se puede reintentar sin ningún riesgo.
  const intentos = 3;
  for (let intento = 0; intento < intentos; intento++) {
    if (intento > 0) await esperar(intento * 1500);
    try {
      const res = await fetch(url.toString());
      return await interpretar(res);
    } catch (e) {
      if (e.message !== MENSAJE_SIN_CONEXION || intento === intentos - 1) throw e;
    }
  }
}

async function send(action, sheet, payload = {}) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL no está configurada. Define la URL del Web App de Apps Script en .env.local"
    );
  }
  // Estas acciones sí cambian datos (registran una venta, crean una fila...),
  // así que a diferencia de list/get NO se reintentan solas: si el problema
  // fue que la respuesta no llegó pero la acción sí se alcanzó a ejecutar,
  // reintentar podría duplicarla. Se le avisa a la persona con un mensaje
  // claro para que decida si repetir la acción.
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, sheet, ...payload }),
  });
  return interpretar(res);
}

export const api = {
  list: (sheet) => request({ action: "list", sheet }),
  get: (sheet, id) => request({ action: "get", sheet, id }),
  create: (sheet, data) => send("create", sheet, { data }),
  update: (sheet, id, data) => send("update", sheet, { id, data }),
  remove: (sheet, id) => send("delete", sheet, { id }),
  login: (email, clave) => send("login", "USUARIOS", { email, clave }),
  cambiarClave: (email, claveActual, claveNueva) => send("cambiarClave", undefined, { email, claveActual, claveNueva }),
  loginCliente: (usuario, clave) => send("loginCliente", "CLIENTES", { usuario, clave }),
  recibirCompra: (data) => send("recibirCompra", undefined, { data }),
  registrarVenta: (data) => send("registrarVenta", undefined, { data }),
  registrarPago: (data) => send("registrarPago", undefined, { data }),
  marcarComisionPagada: (venta_id) => send("marcarComisionPagada", undefined, { data: { venta_id } }),
  eliminarVenta: (venta_id) => send("eliminarVenta", undefined, { data: { venta_id } }),
  eliminarCompra: (compra_id) => send("eliminarCompra", undefined, { data: { compra_id } }),
};
