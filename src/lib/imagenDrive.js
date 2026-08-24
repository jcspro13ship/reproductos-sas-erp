// Convierte un link normal de "compartir" de Google Drive
// (https://drive.google.com/file/d/ID/view?usp=sharing) en una URL que sí
// sirve la imagen directamente para usar en <img src>. Si la URL no es un
// link de Drive (ej. Imgur), se devuelve tal cual. Se usa tanto para el logo
// de la empresa como para las fotos de producto.
export function resolverImagenDrive(url, tamano = 400) {
  if (!url) return null;
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (!match) return url;
  return `https://lh3.googleusercontent.com/d/${match[1]}=w${tamano}`;
}
