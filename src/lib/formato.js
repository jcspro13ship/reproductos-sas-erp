export function formatoMoneda(valor) {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}
