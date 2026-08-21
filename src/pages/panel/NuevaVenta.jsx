import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { hoyDDMMAAAA } from "../../lib/fecha";
import FilasItems from "../../components/FilasItems";
import { useAuth } from "../../context/AuthContext";

export default function NuevaVenta({ onCreada }) {
  const { sesion } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState(hoyDDMMAAAA());
  const [items, setItems] = useState([{ producto_id: "", cantidad: 1, precio_unitario: 0 }]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.list("CLIENTES"), api.list("PRODUCTOS")])
      .then(([c, p]) => {
        setClientes(c);
        setProductos(p);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.registrarVenta({
        cliente_id: clienteId,
        vendedor_id: sesion?.usuario?.id || "",
        fecha,
        items: items.filter((i) => i.producto_id),
      });
      setClienteId("");
      setItems([{ producto_id: "", cantidad: 1, precio_unitario: 0 }]);
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
      <strong style={{ fontSize: 14 }}>Registrar venta</strong>
      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ flex: 1 }}>
          Cliente
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
            <option value="">Selecciona...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label style={{ width: 140 }}>
          Fecha
          <input value={fecha} onChange={(e) => setFecha(e.target.value)} placeholder="DD-MM-AAAA" />
        </label>
      </div>
      <FilasItems items={items} productos={productos} campoMonto="precio_unitario" etiquetaMonto="Precio unitario" onChange={setItems} />
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
      <button className="boton" type="submit" disabled={enviando} style={{ alignSelf: "flex-start" }}>
        {enviando ? "Guardando..." : "Registrar venta"}
      </button>
    </form>
  );
}
