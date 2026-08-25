import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { hoyDDMMAAAA } from "../../lib/fecha";
import FilasItems from "../../components/FilasItems";
import SelectorMoneda from "../../components/SelectorMoneda";
import { useAuth } from "../../context/AuthContext";

export default function NuevaVenta({ onCreada }) {
  const { sesion } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [monedaBase, setMonedaBase] = useState("COP");
  const [tasas, setTasas] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState(hoyDDMMAAAA());
  const [moneda, setMoneda] = useState("COP");
  const [tasaCambio, setTasaCambio] = useState(1);
  const [tipoVenta, setTipoVenta] = useState("");
  const [tiposVenta, setTiposVenta] = useState([]);
  const [items, setItems] = useState([{ producto_id: "", cantidad: 1, precio_unitario: 0 }]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.list("CLIENTES"), api.list("PRODUCTOS"), api.list("EMPRESA"), api.list("TASAS_CAMBIO"), api.list("TIPOS_VENTA")])
      .then(([c, p, empresa, tasasCambio, tv]) => {
        setClientes(c);
        setProductos(p);
        const base = empresa[0]?.moneda_base || "COP";
        setMonedaBase(base);
        setMoneda(base);
        setTasas(tasasCambio);
        setTiposVenta(tv);
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
        moneda,
        tasa_cambio: tasaCambio,
        tipo_venta: tipoVenta,
        items: items.filter((i) => i.producto_id),
      });
      setClienteId("");
      setMoneda(monedaBase);
      setTasaCambio(1);
      setTipoVenta("");
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
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label style={{ flex: 1, minWidth: 180 }}>
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
        <label style={{ width: 160 }}>
          Tipo de venta
          <select value={tipoVenta} onChange={(e) => setTipoVenta(e.target.value)} required>
            <option value="">Selecciona...</option>
            {tiposVenta.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({(Number(t.comision_pct) * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </label>
        <SelectorMoneda
          monedaBase={monedaBase}
          tasas={tasas}
          moneda={moneda}
          tasaCambio={tasaCambio}
          onChange={({ moneda, tasa_cambio }) => {
            setMoneda(moneda);
            setTasaCambio(tasa_cambio);
          }}
        />
      </div>
      <FilasItems
        items={items}
        productos={productos}
        campoMonto="precio_unitario"
        etiquetaMonto={`Precio unitario (${moneda})`}
        onChange={setItems}
      />
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
      <button className="boton" type="submit" disabled={enviando} style={{ alignSelf: "flex-start" }}>
        {enviando ? "Guardando..." : "Registrar venta"}
      </button>
    </form>
  );
}
