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
  // precio_unitario está en la moneda de cada venta; se normaliza a moneda_base con
  // la tasa congelada en esa venta antes de sumar, para no mezclar monedas distintas.
  const tasaPorVenta = new Map(delMes.map((v) => [v.id, Number(v.tasa_cambio) || 1]));
  const total = ventasDetalle
    .filter((d) => tasaPorVenta.has(d.venta_id))
    .reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0) * tasaPorVenta.get(d.venta_id), 0);
  return { cantidad: delMes.length, total };
}

export function comprasDelMes(compras, comprasDetalle) {
  const hoy = new Date();
  const delMes = compras.filter((c) => {
    const fecha = parseDDMMAAAA(c.fecha);
    return fecha && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  });
  // costo_unitario está en la moneda de cada compra; se normaliza a moneda_base
  // con la tasa congelada en esa compra antes de sumar.
  const tasaPorCompra = new Map(delMes.map((c) => [c.id, Number(c.tasa_cambio) || 1]));
  const total = comprasDetalle
    .filter((d) => tasaPorCompra.has(d.compra_id))
    .reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.costo_unitario) || 0) * tasaPorCompra.get(d.compra_id), 0);
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

export function ventasPorMes(ventas, ventasDetalle, { meses = 6, vendedorId } = {}) {
  const hoy = new Date();
  const rango = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    rango.push({ clave: `${d.getFullYear()}-${d.getMonth()}`, etiqueta: d.toLocaleDateString("es-CO", { month: "short" }) });
  }

  const infoPorVenta = new Map();
  ventas.forEach((v) => {
    if (vendedorId && v.vendedor_id !== vendedorId) return;
    const fecha = parseDDMMAAAA(v.fecha);
    if (!fecha) return;
    infoPorVenta.set(v.id, { clave: `${fecha.getFullYear()}-${fecha.getMonth()}`, tasa: Number(v.tasa_cambio) || 1 });
  });

  const sumaPorMes = new Map();
  ventasDetalle.forEach((d) => {
    const info = infoPorVenta.get(d.venta_id);
    if (!info) return;
    const monto = (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0) * info.tasa;
    sumaPorMes.set(info.clave, (sumaPorMes.get(info.clave) || 0) + monto);
  });

  return rango.map((r) => ({ etiqueta: r.etiqueta, valor: sumaPorMes.get(r.clave) || 0 }));
}

export function topProductosVendidos(ventas, ventasDetalle, productos, { top = 5, vendedorId } = {}) {
  const idsVentasValidas = vendedorId
    ? new Set(ventas.filter((v) => v.vendedor_id === vendedorId).map((v) => v.id))
    : null;

  const cantidadPorProducto = new Map();
  ventasDetalle.forEach((d) => {
    if (idsVentasValidas && !idsVentasValidas.has(d.venta_id)) return;
    const cantidad = Number(d.cantidad) || 0;
    cantidadPorProducto.set(d.producto_id, (cantidadPorProducto.get(d.producto_id) || 0) + cantidad);
  });

  const nombreDe = (id) => productos.find((p) => String(p.id) === String(id))?.nombre || id;

  return Array.from(cantidadPorProducto.entries())
    .map(([producto_id, cantidad]) => ({ etiqueta: nombreDe(producto_id), valor: cantidad }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, top);
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
