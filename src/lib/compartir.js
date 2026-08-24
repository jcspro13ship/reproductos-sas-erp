// Comparte un producto individual por WhatsApp (sin número fijo: abre el
// selector de contactos para que se le pueda mandar a cualquiera, a
// diferencia del carrito que sí va dirigido al número del negocio).
export function compartirProducto(producto) {
  const url = `${window.location.origin}${window.location.pathname}#/producto/${producto.id}`;
  const precio = producto.precio != null ? `$${Number(producto.precio).toLocaleString("es-CO")}` : null;
  const lineas = [producto.nombre, precio, url].filter(Boolean);
  const texto = encodeURIComponent(lineas.join("\n"));
  window.open(`https://wa.me/?text=${texto}`, "_blank");
}
