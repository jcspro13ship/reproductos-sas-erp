import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import TablaEditable from "../../components/TablaEditable";
import { resolverListaPublica } from "../../lib/catalogo";
import { coincide } from "../../lib/busqueda";

export default function CatalogoPrecios() {
  const [productos, setProductos] = useState([]);
  const [listas, setListas] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    Promise.all([api.list("PRODUCTOS"), api.list("PRECIOS_PRODUCTO"), api.list("LISTAS_PRECIO")]).then(([p, pr, l]) => {
      setProductos(p);
      setPrecios(pr);
      setListas(l);
    });
  }, [refreshKey]);

  function refrescar() {
    setRefreshKey((k) => k + 1);
  }

  const opcionesProducto = productos.map((p) => ({ value: p.id, label: `${p.nombre} (${p.id})` }));
  const opcionesLista = listas.map((l) => ({ value: l.id, label: l.nombre }));
  const nombreProducto = (id) => productos.find((p) => String(p.id) === String(id))?.nombre || id;
  const nombreLista = (id) => listas.find((l) => String(l.id) === String(id))?.nombre || id;

  // Mismo producto + misma lista más de una vez: una de las filas sobra.
  const repetidos = useMemo(() => {
    const conteo = new Map();
    precios.forEach((f) => {
      const clave = `${f.producto_id}|${f.lista_id}`;
      conteo.set(clave, (conteo.get(clave) || 0) + 1);
    });
    return conteo;
  }, [precios]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <ProductosSinPrecio productos={productos} precios={precios} listas={listas} onGuardado={refrescar} />

      <TablaEditable
        titulo="Listas de precio"
        sheet="LISTAS_PRECIO"
        columnas={[
          { key: "id", label: "ID" },
          { key: "nombre", label: "Nombre" },
          { key: "moneda", label: "Moneda" },
        ]}
        campos={[
          { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
          { key: "moneda", label: "Moneda", tipo: "texto", requerido: true, ayuda: "Código de 3 letras, ej: COP, USD. Toda la lista queda en una sola moneda." },
        ]}
        onGuardado={refrescar}
      />
      <TablaEditable
        key={refreshKey}
        titulo="Precios por producto"
        sheet="PRECIOS_PRODUCTO"
        onGuardado={refrescar}
        buscarEn={[(fila) => nombreProducto(fila.producto_id), "producto_id", (fila) => nombreLista(fila.lista_id)]}
        eliminar={{
          onEliminar: (fila) => api.remove("PRECIOS_PRODUCTO", fila.id),
          confirmar: (fila) =>
            `¿Eliminar el precio de "${nombreProducto(fila.producto_id)}" en la lista "${nombreLista(fila.lista_id)}"? El producto no se borra, solo ese precio. No se puede deshacer.`,
        }}
        columnas={[
          { key: "producto_id", label: "Producto", render: (fila) => nombreProducto(fila.producto_id) },
          { key: "lista_id", label: "Lista", render: (fila) => nombreLista(fila.lista_id) },
          { key: "precio", label: "Precio" },
          {
            key: "repetido",
            label: "",
            render: (fila) =>
              repetidos.get(`${fila.producto_id}|${fila.lista_id}`) > 1 ? (
                <span style={{ color: "crimson", fontSize: 12 }}>Repetido — elimina el que sobre</span>
              ) : null,
          },
        ]}
        campos={[
          { key: "producto_id", label: "Producto", tipo: "select", opciones: opcionesProducto, requerido: true },
          { key: "lista_id", label: "Lista de precio", tipo: "select", opciones: opcionesLista, requerido: true },
          { key: "precio", label: "Precio (incluye IVA, en la moneda de la lista)", tipo: "numero", requerido: true },
        ]}
      />
    </div>
  );
}

// Productos que todavía no tienen precio en la lista elegida (por defecto la
// pública), con el campo para ponérselo ahí mismo — antes había que ubicar
// cada producto nuevo dentro de una lista desplegable larga.
function ProductosSinPrecio({ productos, precios, listas, onGuardado }) {
  const [listaId, setListaId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [valores, setValores] = useState({});
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState(null);

  const listaActiva = listaId || resolverListaPublica(listas)?.id || "";
  const lista = listas.find((l) => String(l.id) === String(listaActiva));

  const sinPrecio = useMemo(() => {
    const conPrecio = new Set(
      precios.filter((f) => String(f.lista_id) === String(listaActiva)).map((f) => String(f.producto_id))
    );
    return productos.filter((p) => !conPrecio.has(String(p.id)) && coincide([p.nombre, p.id], busqueda));
  }, [productos, precios, listaActiva, busqueda]);

  async function guardar(producto) {
    const precio = Number(valores[producto.id]);
    if (!precio || precio <= 0) {
      setError(`Escribe un precio válido para "${producto.nombre}".`);
      return;
    }
    setGuardando(producto.id);
    setError(null);
    try {
      await api.create("PRECIOS_PRODUCTO", { producto_id: producto.id, lista_id: listaActiva, precio });
      setValores((v) => ({ ...v, [producto.id]: "" }));
      onGuardado();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(null);
    }
  }

  if (listas.length === 0) return null;

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <h1 style={{ fontSize: 20 }}>Productos sin precio</h1>
        <label style={{ fontSize: 12 }}>
          Lista
          <select value={listaActiva} onChange={(e) => setListaId(e.target.value)}>
            {listas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre} ({l.moneda})
              </option>
            ))}
          </select>
        </label>
      </div>
      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
        {sinPrecio.length} producto(s) todavía sin precio en "{lista?.nombre}". Escribe el precio y guarda; después aparece abajo en "Precios por producto".
      </p>
      <input
        type="text"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ marginBottom: 12, maxWidth: 320 }}
      />
      {error && <p style={{ color: "crimson", marginBottom: 8 }}>{error}</p>}
      {sinPrecio.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Precio ({lista?.moneda})</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sinPrecio.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.nombre}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={valores[p.id] ?? ""}
                    onChange={(e) => setValores((v) => ({ ...v, [p.id]: e.target.value }))}
                    style={{ width: 130 }}
                  />
                </td>
                <td>
                  <button className="boton" disabled={guardando === p.id} onClick={() => guardar(p)}>
                    {guardando === p.id ? "Guardando..." : "Poner precio"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
