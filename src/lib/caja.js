import { parseDDMMAAAA } from "./fecha";
import { dentroDeRango } from "./periodo";

export function resumenFlujoCaja(pagos, { desde, hasta } = {}) {
  const delPeriodo = pagos.filter((p) => dentroDeRango(parseDDMMAAAA(p.fecha), desde, hasta));

  const cobros = delPeriodo
    .filter((p) => p.referencia_tipo === "cxc")
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const pagosSalida = delPeriodo
    .filter((p) => p.referencia_tipo === "cxp")
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

  return { cobros, pagos: pagosSalida, neto: cobros - pagosSalida };
}
