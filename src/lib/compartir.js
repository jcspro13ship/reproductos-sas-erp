// Comparte un producto individual por WhatsApp (sin número fijo: abre el
// selector de contactos para que se le pueda mandar a cualquiera, a
// diferencia del carrito que sí va dirigido al número del negocio).
//
// El enlace es /p/ID/ (no #/producto/ID): esa página trae la foto, el nombre y
// el precio del producto para la vista previa de WhatsApp y las redes, y luego
// pasa a la ficha en la aplicación.
export function compartirProducto(producto) {
  const base = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}`;
  const url = `${base}p/${producto.id}/`;
  const precio = producto.precio != null ? `$${Number(producto.precio).toLocaleString("es-CO")}` : null;
  const lineas = [producto.nombre, precio, url].filter(Boolean);
  const texto = encodeURIComponent(lineas.join("\n"));
  window.open(`https://wa.me/?text=${texto}`, "_blank");
}

// Enlace limpio del catálogo (carpeta /catalogo/, con vista previa para redes
// sociales). Se desprende de la ruta actual para funcionar igual en
// GitHub Pages que con dominio propio.
export function enlaceCatalogo() {
  const base = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}`;
  return `${base}catalogo/`;
}

// En celular abre el menú de compartir del sistema (WhatsApp, Instagram,
// Facebook...); en computador copia el enlace. Devuelve un texto para avisar.
export async function compartirCatalogo() {
  const url = enlaceCatalogo();
  const datos = {
    title: "Reproduuctos SAS — Catálogo",
    text: "Catálogo de productos de reproducción equina. Consulta precios y haz tu pedido por WhatsApp.",
    url,
  };
  if (navigator.share) {
    try {
      await navigator.share(datos);
      return null;
    } catch (e) {
      if (e.name === "AbortError") return null;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "Enlace copiado. Pégalo en tu red social.";
  } catch {
    return `Copia este enlace: ${url}`;
  }
}
