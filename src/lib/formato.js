export function formatoMoneda(valor) {
  const redondeado = Math.round(valor);
  const signo = redondeado < 0 ? "-" : "";
  return `${signo}$${Math.abs(redondeado).toLocaleString("es-CO")}`;
}
