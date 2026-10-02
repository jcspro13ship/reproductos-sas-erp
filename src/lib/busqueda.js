// Búsqueda tolerante para los buscadores del panel: ignora mayúsculas y
// tildes, acepta varias palabras en cualquier orden, y perdona un error de
// tipeo (ej. "estereoscopio" encuentra "estrereoscopio"). Antes era un
// includes() literal, y por eso un producto escrito con un typo o con tilde
// distinta "no salía" aunque sí existiera.
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function distancia(a, b) {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let anterior = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temporal = prev[j];
      prev[j] = a[i - 1] === b[j - 1] ? anterior : 1 + Math.min(anterior, prev[j], prev[j - 1]);
      anterior = temporal;
    }
  }
  return prev[b.length];
}

function palabraCoincide(palabra, textoNormalizado, palabrasTexto) {
  if (textoNormalizado.includes(palabra)) return true;
  if (palabra.length < 5) return false;
  const tolerancia = palabra.length >= 8 ? 2 : 1;
  return palabrasTexto.some(
    (w) => Math.abs(w.length - palabra.length) <= tolerancia && distancia(w, palabra) <= tolerancia
  );
}

// `textos` puede ser un string o una lista de strings (por ejemplo id + nombre).
export function coincide(textos, consulta) {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const unido = normalizar(Array.isArray(textos) ? textos.join(" ") : textos);
  const palabrasTexto = unido.split(/[^a-z0-9]+/).filter(Boolean);
  return palabras.every((p) => palabraCoincide(p, unido, palabrasTexto));
}
