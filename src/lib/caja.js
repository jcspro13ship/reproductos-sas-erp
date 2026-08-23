import { parseDDMMAAAA } from "./fecha";

export function flujoDeCajaDelMes(pagos) {
  const hoy = new Date();
  const delMes = pagos.filter((p) => {
    const fecha = parseDDMMAAAA(p.fecha);
    return fecha && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  });

  const cobros = delMes
    .filter((p) => p.referencia_tipo === "cxc")
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const pagosSalida = delMes
    .filter((p) => p.referencia_tipo === "cxp")
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

  return { cobros, pagos: pagosSalida, neto: cobros - pagosSalida };
}
