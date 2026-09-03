// Rango de fechas (desde/hasta, ambos opcionales) que se aplica de forma
// uniforme a todos los indicadores del tablero que representan un flujo en el
// tiempo (ventas, compras, comisión generada, cobros/pagos). Los indicadores
// que son un saldo a hoy (CxC/CxP, inventario en negativo) no tienen un
// "período" que tenga sentido — se muestran siempre como están ahora mismo.

export function finDelDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999);
}

export function inicioDeMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

export function finDeMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function inicioDeAnio(fecha) {
  return new Date(fecha.getFullYear(), 0, 1);
}

export function finDeAnio(fecha) {
  return new Date(fecha.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function dentroDeRango(fecha, desde, hasta) {
  if (!fecha) return false;
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;
  return true;
}

export const PRESETS_PERIODO = [
  {
    id: "mes",
    etiqueta: "Este mes",
    rango: () => {
      const hoy = new Date();
      return [inicioDeMes(hoy), finDeMes(hoy)];
    },
  },
  {
    id: "mes_anterior",
    etiqueta: "Mes anterior",
    rango: () => {
      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      return [inicioDeMes(mesAnterior), finDeMes(mesAnterior)];
    },
  },
  {
    id: "anio",
    etiqueta: "Este año",
    rango: () => {
      const hoy = new Date();
      return [inicioDeAnio(hoy), finDeAnio(hoy)];
    },
  },
  {
    id: "todo",
    etiqueta: "Todo",
    rango: () => [null, null],
  },
];
