// Se ejecuta después de `vite build`. Crea una página estática por producto
// (dist/p/<ID>/index.html) con las etiquetas Open Graph de ese producto: foto,
// nombre, precio y descripción. Las redes y WhatsApp no ejecutan la app (es una
// SPA con rutas #/), así que sin esto todos los enlaces mostraban la misma
// tarjeta genérica con el logo pequeño. La persona que abre el enlace pasa
// directo a la ficha del producto en la app.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fusionarPrecios, resolverListaPublica } from "../src/lib/catalogo.js";

const SITIO = process.env.SITIO_URL || "https://jcspro13ship.github.io/reproductos-sas-erp";
const IMAGEN_RESPALDO = `${SITIO}/og-reproduuctos.png`;

async function leerApiUrl() {
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
  for (const archivo of [".env.local", ".env"]) {
    if (!existsSync(archivo)) continue;
    const m = (await readFile(archivo, "utf8")).match(/^VITE_API_URL=(.+)$/m);
    if (m) return m[1].trim();
  }
  return null;
}

async function listar(apiUrl, hoja) {
  const r = await fetch(`${apiUrl}?action=list&sheet=${hoja}`, { redirect: "follow" });
  const json = await r.json();
  if (!json.ok) throw new Error(`${hoja}: ${json.error}`);
  return json.data;
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function imagenGrande(url) {
  const m = String(url || "").match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w1200`;
  return url || null;
}

function resumen(descripcion) {
  const limpio = String(descripcion || "").replace(/\s+/g, " ").trim();
  return limpio.length > 180 ? `${limpio.slice(0, 177)}...` : limpio;
}

function pagina(p, precio) {
  const url = `${SITIO}/p/${p.id}/`;
  const titulo = precio ? `${p.nombre} — ${precio}` : p.nombre;
  const descripcion = resumen(p.descripcion) || "Reproduuctos SAS — soluciones para la reproducción equina. Haz tu pedido por WhatsApp.";
  const imagen = imagenGrande(p.imagen) || IMAGEN_RESPALDO;
  const destino = `../../#/producto/${encodeURIComponent(p.id)}`;
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(titulo)} | Reproduuctos SAS</title>
    <meta name="description" content="${esc(descripcion)}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Reproduuctos SAS" />
    <meta property="og:title" content="${esc(titulo)}" />
    <meta property="og:description" content="${esc(descripcion)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(imagen)}" />
    <meta property="og:locale" content="es_CO" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(titulo)}" />
    <meta name="twitter:description" content="${esc(descripcion)}" />
    <meta name="twitter:image" content="${esc(imagen)}" />
    <meta http-equiv="refresh" content="0; url=${esc(destino)}" />
    <script>window.location.replace(${JSON.stringify(destino)});</script>
  </head>
  <body>
    <p><a href="${esc(destino)}">Ver ${esc(p.nombre)} en el catálogo de Reproduuctos SAS</a></p>
  </body>
</html>
`;
}

const apiUrl = await leerApiUrl();
if (!apiUrl) {
  console.warn("[paginas-producto] Sin VITE_API_URL: no se generan páginas de producto.");
  process.exit(0);
}

try {
  const [productos, precios, listas] = await Promise.all([
    listar(apiUrl, "PRODUCTOS"),
    listar(apiUrl, "PRECIOS_PRODUCTO"),
    listar(apiUrl, "LISTAS_PRECIO"),
  ]);
  const listaId = resolverListaPublica(listas)?.id;
  const visibles = productos.filter((p) => String(p.visible_catalogo) !== "false" && /^[\w-]+$/.test(String(p.id)));
  const conPrecio = fusionarPrecios(visibles, precios, listaId);

  let creadas = 0;
  for (const p of conPrecio) {
    const precio = p.precio != null ? `$${Number(p.precio).toLocaleString("es-CO")}` : null;
    const carpeta = `dist/p/${p.id}`;
    await mkdir(carpeta, { recursive: true });
    await writeFile(`${carpeta}/index.html`, pagina(p, precio));
    creadas++;
  }
  console.log(`[paginas-producto] ${creadas} páginas de producto generadas.`);
} catch (e) {
  // Una falla de red no debe tumbar la publicación: los enlaces siguen
  // funcionando (con la tarjeta genérica) gracias a 404.html.
  console.warn(`[paginas-producto] No se pudieron generar: ${e.message}`);
}
