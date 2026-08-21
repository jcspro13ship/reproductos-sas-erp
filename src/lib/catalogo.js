export function resolverListaPublica(listasPrecio) {
  return (
    listasPrecio.find((l) => l.nombre?.toLowerCase() === "publico" || l.nombre?.toLowerCase() === "público") ||
    listasPrecio[0]
  );
}

export function fusionarPrecios(productos, preciosProducto, listaId) {
  return productos.map((producto) => {
    const precioFila = preciosProducto.find(
      (p) => p.producto_id === producto.id && p.lista_id === listaId
    );
    return { ...producto, precio: precioFila ? Number(precioFila.precio) : null };
  });
}
