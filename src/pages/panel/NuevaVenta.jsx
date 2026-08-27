import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { hoyDDMMAAAA, sumarDias } from "../../lib/fecha";
import FilasItems from "../../components/FilasItems";
import SelectorMoneda from "../../components/SelectorMoneda";
import BuscadorSelect from "../../components/BuscadorSelect";
import { useAuth } from "../../context/AuthContext";

export default function NuevaVenta({ onCreada }) {
  const { sesion } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [listas, setListas] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [listaId, setListaId] = useState("");
  const [monedaBase, setMonedaBase] = useState("COP");
  const [tasas, setTasas] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState(hoyDDMMAAAA());
  const [moneda, setMoneda] = useState("COP");
  const [tasaCambio, setTasaCambio] = useState(1);
  const [tipoVenta, setTipoVenta] = useState("");
  const [tiposVenta, setTiposVenta] = useState([]);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [plazoDias, setPlazoDias] = useState(0);
  const [pagada, setPagada] = useState(false);
  const [items, setItems] = useState([{ producto_id: "", cantidad: 1, precio_unitario: 0 }]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);

  useEffect(() => {
    Promise.all([
      api.list("CLIENTES"),
      api.list("PRODUCTOS"),
      api.list("EMPRESA"),
      api.list("TASAS_CAMBIO"),
      api.list("TIPOS_VENTA"),
      api.list("LISTAS_PRECIO"),
      api.list("PRECIOS_PRODUCTO"),
    ])
      .then(([c, p, empresa, tasasCambio, tv, l, pr]) => {
        setClientes(c);
        setProductos(p);
        const base = empresa[0]?.moneda_base || "COP";
        setMonedaBase(base);
        setMoneda(base);
        setTasas(tasasCambio);
        setTiposVenta(tv);
        setListas(l);
        setPrecios(pr);
        if (l[0]) setListaId(l[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  function precioPara(productoId, listaIdUsar) {
    if (!productoId || !listaIdUsar) return 0;
    const fila = precios.find(
      (pp) => String(pp.producto_id) === String(productoId) && String(pp.lista_id) === String(listaIdUsar)
    );
    return fila ? Number(fila.precio) : 0;
  }

  function handleCambioLista(nuevaListaId) {
    setListaId(nuevaListaId);
    setItems((items) =>
      items.map((it) => (it.producto_id ? { ...it, precio_unitario: precioPara(it.producto_id, nuevaListaId) } : it))
    );
  }

  function handleProductoChange(index, productoId) {
    setItems((items) =>
      items.map((it, i) => (i === index ? { ...it, precio_unitario: precioPara(productoId, listaId) } : it))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const itemsValidos = items.filter((i) => i.producto_id);
      if (itemsValidos.length === 0) throw new Error("Agrega al menos un producto");

      const resultado = await api.registrarVenta({
        cliente_id: clienteId,
        vendedor_id: sesion?.usuario?.id || "",
        fecha,
        moneda,
        tasa_cambio: tasaCambio,
        tipo_venta: tipoVenta,
        numero_factura: numeroFactura,
        plazo_dias: plazoDias,
        fecha_vencimiento: sumarDias(fecha, plazoDias),
        pagada,
        items: itemsValidos,
      });

      setUltimoRegistro({
        numero: resultado.venta.id,
        cliente: clientes.find((c) => String(c.id) === String(clienteId)),
        fecha,
        numeroFactura,
        pagada,
        items: itemsValidos.map((i) => ({
          ...i,
          producto: productos.find((p) => String(p.id) === String(i.producto_id)),
        })),
      });

      setClienteId("");
      setMoneda(monedaBase);
      setTasaCambio(1);
      setTipoVenta("");
      setNumeroFactura("");
      setPlazoDias(0);
      setPagada(false);
      setItems([{ producto_id: "", cantidad: 1, precio_unitario: 0 }]);
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
        <strong style={{ fontSize: 14 }}>Registrar venta</strong>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ flex: 1, minWidth: 180 }}>
            Cliente
            <BuscadorSelect
              opciones={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
              value={clienteId}
              onChange={setClienteId}
              placeholder="Escribe el nombre del cliente..."
              required
            />
          </label>
          <label style={{ width: 200 }}>
            Lista de precio
            <select value={listaId} onChange={(e) => handleCambioLista(e.target.value)}>
              {listas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre} ({l.moneda})
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
              disabled={pagada}
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
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={pagada} onChange={(e) => setPagada(e.target.checked)} />
          Ya fue pagada (registra el cobro completo de una vez, sin pasar por Cartera)
        </label>
        <FilasItems
          items={items}
          productos={productos}
          campoMonto="precio_unitario"
          etiquetaMonto={`Precio unitario (${moneda})`}
          onChange={setItems}
          onProductoChange={handleProductoChange}
        />
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        <button className="boton" type="submit" disabled={enviando} style={{ alignSelf: "flex-start" }}>
          {enviando ? "Guardando..." : "Registrar venta"}
        </button>
      </form>

      {ultimoRegistro && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: "var(--radio)", background: "#f4f4f4" }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Venta {ultimoRegistro.numero} — {ultimoRegistro.cliente?.nombre || "Cliente"} ({ultimoRegistro.fecha})
            {ultimoRegistro.numeroFactura ? ` · Factura ${ultimoRegistro.numeroFactura}` : ""}
            {ultimoRegistro.pagada ? " · Pagada" : ""}
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {ultimoRegistro.items.map((i, idx) => (
              <li key={idx}>
                {i.producto?.nombre || "Producto"} × {i.cantidad} — ${Number(i.precio_unitario).toLocaleString("es-CO")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
