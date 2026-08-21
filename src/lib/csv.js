function escaparCelda(valor) {
  const texto = valor == null ? "" : String(valor);
  if (/[",\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export function filasACSV(filas, columnas) {
  const encabezado = columnas.map((c) => escaparCelda(c.label)).join(",");
  const cuerpo = filas.map((fila) => columnas.map((c) => escaparCelda(fila[c.key])).join(","));
  return [encabezado, ...cuerpo].join("\r\n");
}

export function descargarCSV(nombreArchivo, contenidoCSV) {
  // BOM al inicio para que Excel detecte UTF-8 y no dañe tildes/ñ.
  const blob = new Blob(["﻿" + contenidoCSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
