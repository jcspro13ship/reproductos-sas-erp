import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { generarCodigoProducto } from "../../lib/productos";

export default function NuevoProducto({ onCreado }) {
  const [lineas, setLineas] = useState([]);
  const [listas, setListas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [lineaId, setLineaId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoManual, setCodigoManual] = useState(false);
  const [imagen, setImagen] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ivaPct, setIvaPct] = useState("");
  const [listaId, setListaId] = useState("");
  const [precio, setPrecio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    Promise.all([api.list("LINEAS"), api.list("LISTAS_PRECIO"), api.list("PRODUCTOS")])
      .then(([l, lp, p]) => {
        setLineas(l);
        setListas(lp);
        setProductos(p);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Sugiere el código automáticamente al elegir la línea; si la persona lo
  // edita a mano, dejamos de tocarlo.
  useEffect(() => {
    if (codigoManual || !lineaId) return;
    setCodigo(generarCodigoProducto(lineaId, productos, lineas));
  }, [lineaId, productos, lineas, codigoManual]);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setMensaje(null);
    try {
      const codigoFinal = codigo.trim().toUpperCase();
      if (productos.some((p) => String(p.id).toUpperCase() === codigoFinal)) {
        setError(`Ya existe un producto con el código "${codigoFinal}". Cámbialo e intenta de nuevo.`);
        setEnviando(false);
        return;
      }

      const producto = await api.create("PRODUCTOS", {
        id: codigoFinal,
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

      setMensaje(`"${nombre}" (${producto.id}) se creó correctamente${listaId && precio !== "" ? " con su precio" : ""}.`);
      setProductos((prev) => [...prev, producto]);
      setNombre("");
      setLineaId("");
      setCodigo("");
      setCodigoManual(false);
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
        Código
        <input
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.toUpperCase());
            setCodigoManual(true);
          }}
          required
        />
        <span style={{ display: "block", fontSize: 11, opacity: 0.6, fontWeight: 400 }}>
          Se genera solo según la línea elegida; puedes cambiarlo si lo necesitas.
        </span>
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
