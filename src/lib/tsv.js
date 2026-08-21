export function filasATSV(filas, columnas) {
  return filas
    .map((fila) => columnas.map((c) => (fila[c] ?? "").toString()).join("\t"))
    .join("\n");
}
