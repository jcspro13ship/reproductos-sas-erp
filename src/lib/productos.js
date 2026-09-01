// Sugiere el siguiente código de producto para una línea, siguiendo el patrón que
// ya se usa en los ~110 productos existentes: dos letras según la línea + un
// consecutivo de 3 dígitos (CM001, RA028, TE015...). El prefijo se calcula del
// código más usado entre los productos ya cargados en esa línea, en vez de estar
// escrito a mano, para que siga funcionando aunque cambien las líneas.
export function generarCodigoProducto(lineaId, productos, lineas) {
  const conteoPrefijos = {};
  productos.forEach((p) => {
    if (String(p.linea_id) !== String(lineaId)) return;
    const m = String(p.id).match(/^([A-Za-z]+)/);
    if (!m) return;
    const pre = m[1].toUpperCase();
    conteoPrefijos[pre] = (conteoPrefijos[pre] || 0) + 1;
  });

  let prefijo = Object.entries(conteoPrefijos).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Línea sin productos todavía (recién creada): arma un prefijo con las
  // iniciales del nombre de la línea.
  if (!prefijo) {
    const linea = lineas.find((l) => String(l.id) === String(lineaId));
    const palabras = (linea?.nombre || "").split(/\s+/).filter((w) => w.length > 2);
    if (palabras.length === 1) prefijo = palabras[0].slice(0, 2).toUpperCase();
    else prefijo = palabras.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "PR";
  }

  let maxNumero = 0;
  const patron = new RegExp("^" + prefijo + "(\\d+)");
  productos.forEach((p) => {
    const m = String(p.id).toUpperCase().match(patron);
    if (m) maxNumero = Math.max(maxNumero, parseInt(m[1], 10));
  });

  return prefijo + String(maxNumero + 1).padStart(3, "0");
}
