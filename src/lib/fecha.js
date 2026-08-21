export function hoyDDMMAAAA() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

export function parseDDMMAAAA(texto) {
  if (!texto) return null;
  const [dd, mm, aaaa] = String(texto).split("-").map(Number);
  if (!dd || !mm || !aaaa) return null;
  return new Date(aaaa, mm - 1, dd);
}

// Para leer el valor de un <input type="date"> (formato AAAA-MM-DD) sin desfases de zona horaria.
export function parseFechaInput(iso) {
  if (!iso) return null;
  const [aaaa, mm, dd] = iso.split("-").map(Number);
  if (!dd || !mm || !aaaa) return null;
  return new Date(aaaa, mm - 1, dd);
}
