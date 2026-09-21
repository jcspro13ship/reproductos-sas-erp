// Caché en memoria para api.list(sheet). Vive mientras la pestaña está
// abierta (es un Map a nivel de módulo, no se guarda en localStorage) — así
// que navegar entre páginas del panel no vuelve a pedirle a Google Sheets la
// misma lista de productos/clientes/etc. una y otra vez, que era la causa
// principal de la lentitud.
//
// Se invalida sola pasado el TTL (por si alguien edita el Sheet a mano por
// fuera de la app, que es justo lo que este proyecto permite), y también de
// una vez cada vez que se guarda algo desde la app — ver limpiarCache() en
// api.js.
const TTL_MS = 3 * 60 * 1000; // 3 minutos

const cache = new Map(); // sheet -> { datos, momento }
const enVuelo = new Map(); // sheet -> Promise ya en curso, para no duplicar pedidos simultáneos

export function obtenerDeCache(sheet) {
  const entrada = cache.get(sheet);
  if (!entrada) return undefined;
  if (Date.now() - entrada.momento > TTL_MS) {
    cache.delete(sheet);
    return undefined;
  }
  return entrada.datos;
}

export function guardarEnCache(sheet, datos) {
  cache.set(sheet, { datos, momento: Date.now() });
}

export function obtenerEnVuelo(sheet) {
  return enVuelo.get(sheet);
}

export function registrarEnVuelo(sheet, promesa) {
  enVuelo.set(sheet, promesa);
  promesa.finally(() => enVuelo.delete(sheet));
}

export function limpiarCache() {
  cache.clear();
}
