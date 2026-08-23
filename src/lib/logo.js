// Convierte un link normal de "compartir" de Google Drive
// (https://drive.google.com/file/d/ID/view?usp=sharing) en una URL que sí
// sirve la imagen directamente para usar en <img src>. Si logo_url no es un
// link de Drive (ej. Imgur), se devuelve tal cual.
export function resolverLogoUrl(logoUrl) {
  if (!logoUrl) return null;
  const match = logoUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (!match) return logoUrl;
  return `https://lh3.googleusercontent.com/d/${match[1]}=w400`;
}
