// Las descripciones de producto se escriben en Sheets como texto libre, pero casi
// siempre usan las mismas palabras para separar secciones (Modo de uso, Fórmula,
// Beneficios...). Esto detecta esas líneas-título y agrupa el resto como el
// contenido de cada sección, para poder mostrarlas visualmente separadas sin
// tener que reescribir las ~500 descripciones existentes.
const PALABRAS_TITULO = [
  "beneficios",
  "beneficios clave",
  "modo de uso",
  "presentación",
  "presentación/dosificación",
  "fórmula",
  "formula",
  "método de preparación",
  "instrucciones de uso y dosificación",
  "instrucciones de uso",
  "indicaciones de uso",
  "indicaciones",
  "composición",
  "composicion",
  "aplicaciones",
  "almacenamiento",
  "ingredientes",
  "características clave",
  "caracteristicas clave",
  "uso",
  "precauciones",
  "contraindicaciones",
  "contenido",
  "método y forma de administración",
  "dosis",
  "dosificación",
  "vía de administración",
  "advertencias",
  "recomendaciones",
  "efectos secundarios",
  "reacciones adversas",
];

function esTitulo(linea) {
  const s = linea.trim();
  if (!s) return false;
  const core = s.replace(/:\s*$/, "").trim().toLowerCase();
  if (PALABRAS_TITULO.includes(core)) return true;
  if (/^cada .+ contiene$/.test(core)) return true;
  return false;
}

// Devuelve [{ titulo: string|null, contenido: string }]. La primera sección
// (antes del primer título detectado) tiene titulo null.
export function parsearDescripcion(texto) {
  if (!texto) return [];
  const lineas = String(texto).split("\n");
  const secciones = [];
  let actual = { titulo: null, lineas: [] };
  lineas.forEach((linea) => {
    if (esTitulo(linea)) {
      if (actual.titulo || actual.lineas.some((l) => l.trim())) secciones.push(actual);
      actual = { titulo: linea.trim().replace(/:\s*$/, ""), lineas: [] };
    } else {
      actual.lineas.push(linea);
    }
  });
  if (actual.titulo || actual.lineas.some((l) => l.trim())) secciones.push(actual);
  return secciones
    .map((s) => ({ titulo: s.titulo, contenido: s.lineas.join("\n").trim() }))
    .filter((s) => s.titulo || s.contenido);
}
