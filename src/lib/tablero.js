import { parseDDMMAAAA } from "./fecha";
import { dentroDeRango } from "./periodo";

export function productosEnNegativo(productos) {
  return productos.filter((p) => Number(p.stock_actual) < 0);
}

export function resumenVentas(ventas, ventasDetalle, { desde, hasta, vendedorId } = {}) {
  const filtradas = ventas.filter((v) => {
    const coincideFecha = dentroDeRango(parseDDMMAAAA(v.fecha), desde, hasta);
    const coincideVendedor = !vendedorId || v.vendedor_id === vendedorId;
    return coincideFecha && coincideVendedor;
  });
  // precio_unitario está en la moneda de cada venta; se normaliza a moneda_base con
  // la tasa congelada en esa venta antes de sumar, para no mezclar monedas distintas.
  const tasaPorVenta = new Map(filtradas.map((v) => [v.id, Number(v.tasa_cambio) || 1]));
  const total = ventasDetalle
    .filter((d) => tasaPorVenta.has(d.venta_id))
    .reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0) * tasaPorVenta.get(d.venta_id), 0);
  return { cantidad: filtradas.length, total };
}

export function resumenCompras(compras, comprasDetalle, { desde, hasta } = {}) {
  const filtradas = compras.filter((c) => dentroDeRango(parseDDMMAAAA(c.fecha), desde, hasta));
  // costo_unitario está en la moneda de cada compra; se normaliza a moneda_base
  // con la tasa congelada en esa compra antes de sumar.
  const tasaPorCompra = new Map(filtradas.map((c) => [c.id, Number(c.tasa_cambio) || 1]));
  const total = comprasDetalle
    .filter((d) => tasaPorCompra.has(d.compra_id))
    .reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.costo_unitario) || 0) * tasaPorCompra.get(d.compra_id), 0);
  return { cantidad: filtradas.length, total };
}

// La comisión "pendiente" es un saldo por pagar (estado, no fecha) — se
// muestra siempre completa sin importar el período elegido en el tablero,
// para que quien liquida vea todo lo que falta por pagar.
export function comisionPendiente(comisiones, vendedorId) {
  return comisiones
    .filter((c) => c.vendedor_id === vendedorId && c.estado_pago === "pendiente")
    .reduce((acc, c) => acc + (Number(c.valor_comision) || 0), 0);
}

// CxC/CxP son un saldo a hoy, no un movimiento del período — por eso este
// resumen no recibe desde/hasta, siempre refleja el saldo actual.
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

// Barras mensuales dentro del período elegido. Si el período es "todo el
// tiempo" (desde/hasta ambos vacíos), el rango de meses se calcula a partir
// de las fechas reales de las ventas (no un número fijo de meses), para no
// cortar datos viejos ni inventar meses vacíos si hay poco histórico.
export function ventasPorPeriodo(ventas, ventasDetalle, { desde, hasta, vendedorId } = {}) {
  const infoPorVenta = new Map();
  ventas.forEach((v) => {
    if (vendedorId && v.vendedor_id !== vendedorId) return;
    const fecha = parseDDMMAAAA(v.fecha);
    if (!dentroDeRango(fecha, desde, hasta)) return;
    infoPorVenta.set(v.id, { fecha, clave: `${fecha.getFullYear()}-${fecha.getMonth()}`, tasa: Number(v.tasa_cambio) || 1 });
  });

  const hoy = new Date();
  const fechasEncontradas = Array.from(infoPorVenta.values()).map((info) => info.fecha);
  const inicioRango = desde || (fechasEncontradas.length ? new Date(Math.min(...fechasEncontradas)) : new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1));
  const finRango = hasta || (fechasEncontradas.length ? new Date(Math.max(...fechasEncontradas)) : hoy);

  const meses = [];
  let cursor = new Date(inicioRango.getFullYear(), inicioRango.getMonth(), 1);
  const limite = new Date(finRango.getFullYear(), finRango.getMonth(), 1);
  while (cursor <= limite && meses.length < 24) {
    meses.push({ clave: `${cursor.getFullYear()}-${cursor.getMonth()}`, etiqueta: cursor.toLocaleDateString("es-CO", { month: "short", year: "2-digit" }) });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  const sumaPorMes = new Map();
  ventasDetalle.forEach((d) => {
    const info = infoPorVenta.get(d.venta_id);
    if (!info) return;
    const monto = (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0) * info.tasa;
    sumaPorMes.set(info.clave, (sumaPorMes.get(info.clave) || 0) + monto);
  });

  return meses.map((m) => ({ etiqueta: m.etiqueta, valor: sumaPorMes.get(m.clave) || 0 }));
}

export function topProductosVendidos(ventas, ventasDetalle, productos, { top = 5, vendedorId, desde, hasta } = {}) {
  const idsVentasValidas = new Set(
    ventas
      .filter((v) => (!vendedorId || v.vendedor_id === vendedorId) && dentroDeRango(parseDDMMAAAA(v.fecha), desde, hasta))
      .map((v) => v.id)
  );

  const cantidadPorProducto = new Map();
  ventasDetalle.forEach((d) => {
    if (!idsVentasValidas.has(d.venta_id)) return;
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
