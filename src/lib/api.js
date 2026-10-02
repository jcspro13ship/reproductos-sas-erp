import { API_URL } from "../config";
import { obtenerDeCache, guardarEnCache, obtenerEnVuelo, registrarEnVuelo, limpiarCache } from "./cache";

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

  // list/get no modifican nada, así que ante CUALQUIER error (JSON inválido,
  // o el "Acción GET no reconocida: undefined" que sale cuando Google pierde
  // el parámetro action en el camino) se puede reintentar sin ningún riesgo,
  // no solo ante el caso puntual de respuesta no-JSON.
  const intentos = 3;
  for (let intento = 0; intento < intentos; intento++) {
    if (intento > 0) await esperar(intento * 1500);
    try {
      const res = await fetch(url.toString());
      return await interpretar(res);
    } catch (e) {
      if (intento === intentos - 1) throw e;
    }
  }
}

const SIN_REINTENTO = new Set(["login", "loginCliente", "cambiarClave"]);
const MENSAJE_NO_CONFIRMADO =
  "No se pudo confirmar si se guardó (Google no devolvió la respuesta). Revisa la lista antes de volver a intentarlo, para no duplicarlo.";

function nuevoRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Errores en los que no se sabe si la acción llegó a ejecutarse: la respuesta
// se perdió en el camino (a veces sale como "Acción GET no reconocida"), pero
// el guardado pudo haberse hecho.
function respuestaPerdida(e) {
  return e instanceof TypeError || e.message === MENSAJE_SIN_CONEXION || /Acción GET no reconocida/.test(e.message);
}

async function send(action, sheet, payload = {}) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL no está configurada. Define la URL del Web App de Apps Script en .env.local"
    );
  }
  // Cada acción que guarda algo lleva un request_id: el backend (ver
  // ejecutarUnaSolaVez en Code.gs) recuerda las que ya ejecutó, así que si la
  // respuesta se pierde se puede reintentar con el mismo id sin que se guarde
  // dos veces. Antes un error de esos hacía que la persona le diera "Guardar"
  // otra vez y quedaran cotizaciones o clientes repetidos.
  const idempotente = !SIN_REINTENTO.has(action);
  const requestId = idempotente ? nuevoRequestId() : undefined;
  const intentos = idempotente ? 3 : 1;

  try {
    for (let intento = 0; intento < intentos; intento++) {
      if (intento > 0) await esperar(intento * 2000);
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action, sheet, request_id: requestId, ...payload }),
        });
        return await interpretar(res);
      } catch (e) {
        if (!idempotente || !respuestaPerdida(e)) throw e;
        if (intento === intentos - 1) throw new Error(MENSAJE_NO_CONFIRMADO);
      }
    }
  } finally {
    // Una acción que guarda puede haber tocado varias pestañas (una venta
    // cambia VENTAS, stock de PRODUCTOS, COMISIONES, CXC...), así que se
    // limpia todo el caché, haya salido bien o no: la próxima lectura vuelve
    // a pedirse fresca.
    limpiarCache();
  }
}

// list() se guarda en caché (unos minutos, o hasta que algo se guarde desde
// la app) porque es, por mucho, la llamada más repetida: casi cada página del
// panel pide productos/clientes/líneas/etc. de nuevo, aunque otra página ya
// los haya pedido hace unos segundos. Si dos componentes piden la misma hoja
// al mismo tiempo (típico al cargar una página con varias secciones),
// comparten un solo pedido en vez de duplicarlo.
async function list(sheet) {
  const enCache = obtenerDeCache(sheet);
  if (enCache !== undefined) return enCache;

  const yaEnVuelo = obtenerEnVuelo(sheet);
  if (yaEnVuelo) return yaEnVuelo;

  const promesa = request({ action: "list", sheet }).then((datos) => {
    guardarEnCache(sheet, datos);
    return datos;
  });
  registrarEnVuelo(sheet, promesa);
  return promesa;
}

export const api = {
  list,
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
  armarKit: (data) => send("armarKit", undefined, { data }),
  guardarCotizacion: (data) => send("guardarCotizacion", undefined, { data }),
  actualizarCotizacion: (data) => send("actualizarCotizacion", undefined, { data }),
  eliminarCotizacion: (cotizacion_id) => send("eliminarCotizacion", undefined, { data: { cotizacion_id } }),
  eliminarCliente: (cliente_id) => send("eliminarCliente", undefined, { data: { cliente_id } }),
  eliminarProducto: (producto_id) => send("eliminarProducto", undefined, { data: { producto_id } }),
};
