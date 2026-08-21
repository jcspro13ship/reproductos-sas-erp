import { parseDDMMAAAA } from "./fecha";

export function productosEnNegativo(productos) {
  return productos.filter((p) => Number(p.stock_actual) < 0);
}

export function ventasDelMes(ventas, ventasDetalle, { vendedorId } = {}) {
  const hoy = new Date();
  const delMes = ventas.filter((v) => {
    const fecha = parseDDMMAAAA(v.fecha);
    const coincideFecha = fecha && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
    const coincideVendedor = !vendedorId || v.vendedor_id === vendedorId;
    return coincideFecha && coincideVendedor;
  });
  const ids = new Set(delMes.map((v) => v.id));
  const total = ventasDetalle
    .filter((d) => ids.has(d.venta_id))
    .reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0), 0);
  return { cantidad: delMes.length, total };
}

export function comisionPendiente(comisiones, vendedorId) {
  return comisiones
    .filter((c) => c.vendedor_id === vendedorId && c.estado_pago === "pendiente")
    .reduce((acc, c) => acc + (Number(c.valor_comision) || 0), 0);
}

export function resumenCartera(cuentas, { ventas, vendedorId } = {}) {
  const idsPropios = vendedorId ? new Set(ventas.filter((v) => v.vendedor_id === vendedorId).map((v) => v.id)) : null;
  const filtradas = idsPropios ? cuentas.filter((c) => idsPropios.has(c.venta_id)) : cuentas;

  const hoy = new Date();
  let total = 0;
  let vencido = 0;
  filtradas.forEach((c) => {
    const saldo = Number(c.saldo) || 0;
    total += saldo;
    const vencimiento = parseDDMMAAAA(c.fecha_vencimiento);
    if (vencimiento && vencimiento < hoy) vencido += saldo;
  });
  return { total, vencido, cantidad: filtradas.length };
}

export function porVencerEnDias(cuentas, dias) {
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + dias);
  return cuentas.filter((c) => {
    const vencimiento = parseDDMMAAAA(c.fecha_vencimiento);
    return vencimiento && vencimiento >= hoy && vencimiento <= limite;
  });
}
