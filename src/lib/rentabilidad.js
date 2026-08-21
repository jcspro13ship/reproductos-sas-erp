// La rentabilidad de una venta se apoya en MOVIMIENTOS_INVENTARIO: cada salida
// de venta quedó registrada con el costo_promedio vigente en ese momento
// (ver registrarVenta en apps-script/Code.gs), así que no hay que recalcularlo.

export function calcularValorInventario(productos) {
  return productos.reduce((acc, p) => acc + (Number(p.stock_actual) || 0) * (Number(p.costo_promedio) || 0), 0);
}

export function calcularRentabilidadPorVenta(ventas, ventasDetalle, movimientos) {
  const salidas = movimientos.filter((m) => m.tipo === "salida" && m.referencia_tipo === "venta");

  return ventas.map((venta) => {
    // precio_unitario queda en la moneda de la venta; el costo (de MOVIMIENTOS_INVENTARIO)
    // siempre está en moneda_base, así que el ingreso se convierte con la tasa congelada
    // en la venta para que ambos sean comparables. tasa_cambio ausente = venta antigua o
    // ya en moneda_base -> 1.
    const tasaCambio = Number(venta.tasa_cambio) || 1;
    const lineas = ventasDetalle.filter((d) => d.venta_id === venta.id);
    let ingreso = 0;
    let costo = 0;

    lineas.forEach((linea) => {
      const cantidad = Number(linea.cantidad) || 0;
      ingreso += cantidad * (Number(linea.precio_unitario) || 0) * tasaCambio;
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
