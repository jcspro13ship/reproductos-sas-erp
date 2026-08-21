// La rentabilidad de una venta se apoya en MOVIMIENTOS_INVENTARIO: cada salida
// de venta quedó registrada con el costo_promedio vigente en ese momento
// (ver registrarVenta en apps-script/Code.gs), así que no hay que recalcularlo.

export function calcularValorInventario(productos) {
  return productos.reduce((acc, p) => acc + (Number(p.stock_actual) || 0) * (Number(p.costo_promedio) || 0), 0);
}

export function calcularRentabilidadPorVenta(ventas, ventasDetalle, movimientos) {
  const salidas = movimientos.filter((m) => m.tipo === "salida" && m.referencia_tipo === "venta");

  return ventas.map((venta) => {
    const lineas = ventasDetalle.filter((d) => d.venta_id === venta.id);
    let ingreso = 0;
    let costo = 0;

    lineas.forEach((linea) => {
      const cantidad = Number(linea.cantidad) || 0;
      ingreso += cantidad * (Number(linea.precio_unitario) || 0);
      const movimiento = salidas.find(
        (m) => m.referencia_id === venta.id && m.producto_id === linea.producto_id
      );
      costo += cantidad * (Number(movimiento?.costo_unitario) || 0);
    });

    const utilidad = ingreso - costo;
    const margen = ingreso > 0 ? utilidad / ingreso : 0;

    return { venta, ingreso, costo, utilidad, margen };
  });
}
