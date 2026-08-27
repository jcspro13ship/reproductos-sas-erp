import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function NuevoProducto({ onCreado }) {
  const [lineas, setLineas] = useState([]);
  const [listas, setListas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [lineaId, setLineaId] = useState("");
  const [imagen, setImagen] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ivaPct, setIvaPct] = useState("");
  const [listaId, setListaId] = useState("");
  const [precio, setPrecio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    Promise.all([api.list("LINEAS"), api.list("LISTAS_PRECIO")])
      .then(([l, lp]) => {
        setLineas(l);
        setListas(lp);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setMensaje(null);
    try {
      const producto = await api.create("PRODUCTOS", {
        nombre,
        linea_id: lineaId,
        imagen,
        descripcion,
        iva_pct: ivaPct === "" ? 0 : Number(ivaPct) / 100,
        costo_promedio: 0,
        stock_actual: 0,
        visible_catalogo: "true",
      });

      if (listaId && precio !== "") {
        await api.create("PRECIOS_PRODUCTO", {
          producto_id: producto.id,
          lista_id: listaId,
          precio: Number(precio),
        });
      }

      setMensaje(`"${nombre}" se creó correctamente${listaId && precio !== "" ? " con su precio" : ""}.`);
      setNombre("");
      setLineaId("");
      setImagen("");
      setDescripcion("");
      setIvaPct("");
      setListaId("");
      setPrecio("");
      onCreado?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ border: "1px solid var(--color-borde)", borderRadius: "var(--radio)", padding: 16, display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}
    >
      <strong style={{ fontSize: 14 }}>Nuevo producto</strong>
      <label>
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </label>
      <label>
        Línea
        <select value={lineaId} onChange={(e) => setLineaId(e.target.value)} required>
          <option value="">Selecciona...</option>
          {lineas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        Foto (link de Drive o Imgur)
        <input value={imagen} onChange={(e) => setImagen(e.target.value)} />
        <span style={{ display: "block", fontSize: 11, opacity: 0.6, fontWeight: 400 }}>
          Link normal de "compartir" de Drive (debe estar en "Cualquiera con el enlace") o de Imgur
        </span>
      </label>
      <label>
        Descripción
        <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </label>
      <label>
        IVA (%)
        <input type="number" step="0.1" value={ivaPct} onChange={(e) => setIvaPct(e.target.value)} placeholder="0 para exento/excluido" />
      </label>
      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ flex: 1 }}>
          Lista de precio (opcional)
          <select value={listaId} onChange={(e) => setListaId(e.target.value)}>
            <option value="">Sin precio por ahora</option>
            {listas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre} ({l.moneda})
              </option>
            ))}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          Precio
          <input
            type="number"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            disabled={!listaId}
            placeholder={listaId ? "" : "Elige una lista primero"}
          />
        </label>
      </div>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
      {mensaje && <p style={{ color: "green", fontSize: 13 }}>{mensaje}</p>}
      <button className="boton" type="submit" disabled={enviando} style={{ alignSelf: "flex-start" }}>
        {enviando ? "Guardando..." : "Crear producto"}
      </button>
    </form>
  );
}
