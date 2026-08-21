import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { hoyDDMMAAAA } from "../../lib/fecha";
import FilasItems from "../../components/FilasItems";

export default function NuevaCompra({ onCreada }) {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedorId, setProveedorId] = useState("");
  const [fecha, setFecha] = useState(hoyDDMMAAAA());
  const [items, setItems] = useState([{ producto_id: "", cantidad: 1, costo_unitario: 0 }]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.list("PROVEEDORES"), api.list("PRODUCTOS")])
      .then(([p, pr]) => {
        setProveedores(p);
        setProductos(pr);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.recibirCompra({
        proveedor_id: proveedorId,
        fecha,
        items: items.filter((i) => i.producto_id),
      });
      setProveedorId("");
      setItems([{ producto_id: "", cantidad: 1, costo_unitario: 0 }]);
      onCreada?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ border: "1px solid var(--color-borde)", borderRadius: "var(--radio)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <strong style={{ fontSize: 14 }}>Registrar compra</strong>
      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ flex: 1 }}>
          Proveedor
          <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} required>
            <option value="">Selecciona...</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label style={{ width: 140 }}>
          Fecha
          <input value={fecha} onChange={(e) => setFecha(e.target.value)} placeholder="DD-MM-AAAA" />
        </label>
      </div>
      <FilasItems items={items} productos={productos} campoMonto="costo_unitario" etiquetaMonto="Costo unitario" onChange={setItems} />
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
      <button className="boton" type="submit" disabled={enviando} style={{ alignSelf: "flex-start" }}>
        {enviando ? "Guardando..." : "Registrar compra"}
      </button>
    </form>
  );
}
