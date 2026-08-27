import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { hoyDDMMAAAA, sumarDias } from "../../lib/fecha";
import FilasItems from "../../components/FilasItems";
import SelectorMoneda from "../../components/SelectorMoneda";
import BuscadorSelect from "../../components/BuscadorSelect";

export default function NuevaCompra({ onCreada }) {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [monedaBase, setMonedaBase] = useState("COP");
  const [tasas, setTasas] = useState([]);
  const [proveedorId, setProveedorId] = useState("");
  const [fecha, setFecha] = useState(hoyDDMMAAAA());
  const [moneda, setMoneda] = useState("COP");
  const [tasaCambio, setTasaCambio] = useState(1);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [plazoDias, setPlazoDias] = useState(0);
  const [items, setItems] = useState([{ producto_id: "", cantidad: 1, costo_unitario: 0 }]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);

  useEffect(() => {
    Promise.all([api.list("PROVEEDORES"), api.list("PRODUCTOS"), api.list("EMPRESA"), api.list("TASAS_CAMBIO")])
      .then(([p, pr, empresa, tasasCambio]) => {
        setProveedores(p);
        setProductos(pr);
        const base = empresa[0]?.moneda_base || "COP";
        setMonedaBase(base);
        setMoneda(base);
        setTasas(tasasCambio);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const itemsValidos = items.filter((i) => i.producto_id);
      if (itemsValidos.length === 0) throw new Error("Agrega al menos un producto");

      await api.recibirCompra({
        proveedor_id: proveedorId,
        fecha,
        moneda,
        tasa_cambio: tasaCambio,
        numero_factura: numeroFactura,
        plazo_dias: plazoDias,
        fecha_vencimiento: sumarDias(fecha, plazoDias),
        items: itemsValidos,
      });

      setUltimoRegistro({
        proveedor: proveedores.find((p) => String(p.id) === String(proveedorId)),
        fecha,
        numeroFactura,
        items: itemsValidos.map((i) => ({
          ...i,
          producto: productos.find((p) => String(p.id) === String(i.producto_id)),
        })),
      });

      setProveedorId("");
      setMoneda(monedaBase);
      setTasaCambio(1);
      setNumeroFactura("");
      setPlazoDias(0);
      setItems([{ producto_id: "", cantidad: 1, costo_unitario: 0 }]);
      onCreada?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        style={{ border: "1px solid var(--color-borde)", borderRadius: "var(--radio)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
      >
        <strong style={{ fontSize: 14 }}>Registrar compra</strong>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ flex: 1, minWidth: 180 }}>
            Proveedor
            <BuscadorSelect
              opciones={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
              value={proveedorId}
              onChange={setProveedorId}
              placeholder="Escribe el nombre del proveedor..."
              required
            />
          </label>
          <label style={{ width: 140 }}>
            Fecha
            <input value={fecha} onChange={(e) => setFecha(e.target.value)} placeholder="DD-MM-AAAA" />
          </label>
          <label style={{ width: 180 }}>
            N.° de factura / documento
            <input value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} placeholder="Ej: FC-1023" />
          </label>
          <label style={{ width: 150 }}>
            Plazo de pago (días)
            <input
              type="number"
              min="0"
              value={plazoDias === 0 ? "" : plazoDias}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setPlazoDias(e.target.value === "" ? 0 : Number(e.target.value))}
              placeholder="0 = de contado"
            />
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
          campoMonto="costo_unitario"
          etiquetaMonto={`Costo unitario (${moneda})`}
          onChange={setItems}
        />
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        <button className="boton" type="submit" disabled={enviando} style={{ alignSelf: "flex-start" }}>
          {enviando ? "Guardando..." : "Registrar compra"}
        </button>
      </form>

      {ultimoRegistro && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: "var(--radio)", background: "#f4f4f4" }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Compra registrada — {ultimoRegistro.proveedor?.nombre || "Proveedor"} ({ultimoRegistro.fecha})
            {ultimoRegistro.numeroFactura ? ` · Factura ${ultimoRegistro.numeroFactura}` : ""}
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {ultimoRegistro.items.map((i, idx) => (
              <li key={idx}>
                {i.producto?.nombre || "Producto"} × {i.cantidad} — ${Number(i.costo_unitario).toLocaleString("es-CO")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
