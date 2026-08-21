// Extrae los 2 colores más frecuentes de una imagen (para sugerir colores de marca
// a partir del logo), ignorando fondos casi blancos/negros y píxeles transparentes.
// Todo corre en el navegador con Canvas, sin subir la imagen a ningún servicio.
export function extraerColoresDeImagen(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
      img.onload = () => {
        try {
          resolve(coloresDominantes(img));
        } catch (err) {
          reject(err);
        }
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

function coloresDominantes(img) {
  const tamano = 64;
  const canvas = document.createElement("canvas");
  canvas.width = tamano;
  canvas.height = tamano;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, tamano, tamano);
  const { data } = ctx.getImageData(0, 0, tamano, tamano);

  const paso = 24;
  const conteo = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue;
    const brillo = (r + g + b) / 3;
    if (brillo > 240 || brillo < 15) continue;
    const clave = [Math.round(r / paso) * paso, Math.round(g / paso) * paso, Math.round(b / paso) * paso].join(",");
    conteo.set(clave, (conteo.get(clave) || 0) + 1);
  }

  const ordenados = [...conteo.entries()].sort((a, b) => b[1] - a[1]);
  if (ordenados.length === 0) return null;

  const aHex = (clave) =>
    "#" +
    clave
      .split(",")
      .map(Number)
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("");

  return {
    primario: aHex(ordenados[0][0]),
    secundario: ordenados[1] ? aHex(ordenados[1][0]) : aHex(ordenados[0][0]),
  };
}
