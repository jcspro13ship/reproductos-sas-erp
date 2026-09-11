import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { hoyDDMMAAAA } from "../../lib/fecha";
import BuscadorSelect from "../../components/BuscadorSelect";

export default function ArmarKit({ onArmado }) {
  const [productos, setProductos] = useState([]);
  const [receta, setReceta] = useState([]);
  const [kitId, setKitId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  function cargar() {
    setCargando(true);
    Promise.all([api.list("PRODUCTOS"), api.list("KIT_COMPONENTES")])
      .then(([p, kc]) => {
        setProductos(p);
        setReceta(kc);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  const kits = useMemo(() => productos.filter((p) => String(p.es_kit) === "true"), [productos]);
  const opcionesKit = kits.map((k) => ({ value: k.id, label: `${k.nombre} (${k.id})` }));

  const componentesDelKit = useMemo(
    () => receta.filter((r) => String(r.kit_producto_id) === String(kitId)),
    [receta, kitId]
  );

  function productoDe(id) {
    return productos.find((p) => String(p.id) === String(id));
  }

  const kitSeleccionado = productoDe(kitId);
  const cantidadNum = Number(cantidad) || 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setMensaje(null);
    try {
      const resultado = await api.armarKit({ kit_producto_id: kitId, cantidad: cantidadNum, fecha: hoyDDMMAAAA() });
      setMensaje(
        `Se armaron ${cantidadNum} unidades de "${kitSeleccionado?.nombre}". Stock actual del kit: ${resultado.kit_stock_actual}.`
      );
      setCantidad(1);
      cargar();
      onArmado?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <p>Cargando...</p>;

  return (
    <form
      onSubmit={handleSubmit}
      style={{ border: "1px solid var(--color-borde)", borderRadius: "var(--radio)", padding: 16, display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}
    >
      <strong style={{ fontSize: 14 }}>Armar kit</strong>

      {error && kits.length === 0 && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      {!error && kits.length === 0 && (
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          No hay ningún kit creado todavía. Marca "Es un kit armado con otros productos" al crear un producto nuevo
          para poder armarlo aquí.
        </p>
      )}

      {kits.length > 0 && (
        <>
          <label>
            Kit
            <BuscadorSelect opciones={opcionesKit} value={kitId} onChange={setKitId} placeholder="Escribe el nombre del kit..." />
          </label>

          {kitId && componentesDelKit.length === 0 && (
            <p style={{ fontSize: 13, color: "crimson" }}>
              Este kit no tiene componentes definidos — revisa KIT_COMPONENTES en el Sheet.
            </p>
          )}

          {kitId && componentesDelKit.length > 0 && (
            <div style={{ fontSize: 13 }}>
              <div style={{ opacity: 0.7, marginBottom: 4 }}>Se arma con:</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {componentesDelKit.map((c, i) => {
                  const producto = productoDe(c.producto_id);
                  const necesario = Number(c.cantidad) * cantidadNum;
                  const disponible = Number(producto?.stock_actual) || 0;
                  const alcanza = disponible >= necesario;
                  return (
                    <li key={i} style={{ color: alcanza ? "inherit" : "crimson" }}>
                      {producto?.nombre || c.producto_id}: {c.cantidad} por unidad — stock actual {disponible}
                      {!alcanza && ` (faltan ${necesario - disponible})`}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <label>
            Cantidad a armar
            <input
              type="number"
              min="1"
              value={cantidad}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setCantidad(e.target.value)}
              required
            />
          </label>

          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          {mensaje && <p style={{ color: "green", fontSize: 13 }}>{mensaje}</p>}
          <button
            className="boton"
            type="submit"
            disabled={enviando || !kitId || componentesDelKit.length === 0}
            style={{ alignSelf: "flex-start" }}
          >
            {enviando ? "Armando..." : "Armar kit"}
          </button>
        </>
      )}
    </form>
  );
}
