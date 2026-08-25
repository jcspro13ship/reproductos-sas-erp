import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { hoyDDMMAAAA } from "../../lib/fecha";
import FilasItems from "../../components/FilasItems";
import { useAuth } from "../../context/AuthContext";

export default function NuevaCotizacion({ onGuardada }) {
  const { sesion } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [listas, setListas] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [tiposVenta, setTiposVenta] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [listaId, setListaId] = useState("");
  const [tipoVenta, setTipoVenta] = useState("");
  const [fecha, setFecha] = useState(hoyDDMMAAAA());
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState([{ producto_id: "", cantidad: 1, precio_unitario: 0 }]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [ultimoGuardadoId, setUltimoGuardadoId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.list("CLIENTES"),
      api.list("PRODUCTOS"),
      api.list("LISTAS_PRECIO"),
      api.list("PRECIOS_PRODUCTO"),
      api.list("TIPOS_VENTA"),
    ])
      .then(([c, p, l, pr, tv]) => {
        setClientes(c);
        setProductos(p);
        setListas(l);
        setPrecios(pr);
        setTiposVenta(tv);
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

      const cotizacion = await api.create("COTIZACIONES", {
        cliente_id: clienteId,
        vendedor_id: sesion?.usuario?.id || "",
        fecha,
        estado: "pendiente",
        lista_precio_id: listaId,
        tipo_venta: tipoVenta,
        notas,
      });

      // Secuencial: Apps Script solo procesa una escritura a la vez (usa un
      // candado por ejecución), así que mandar todas las filas en paralelo
      // hace que se crucen y truene "tiempo de espera del candado agotado".
      const detallesGuardados = [];
      for (const i of itemsValidos) {
        const detalle = await api.create("COTIZACIONES_DETALLE", {
          cotizacion_id: cotizacion.id,
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
        });
        detallesGuardados.push(detalle);
      }

      setUltimoGuardadoId(cotizacion.id);
      onGuardada?.({
        cotizacion,
        cliente: clientes.find((c) => String(c.id) === String(clienteId)),
        lista: listas.find((l) => String(l.id) === String(listaId)),
        notas,
        items: itemsValidos.map((i) => ({ ...i, producto: productos.find((p) => String(p.id) === String(i.producto_id)) })),
      });

      setClienteId("");
      setTipoVenta("");
      setNotas("");
      setItems([{ producto_id: "", cantidad: 1, precio_unitario: 0 }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const total = items.reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precio_unitario) || 0), 0);

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="no-print"
        style={{ border: "1px solid var(--color-borde)", borderRadius: "var(--radio)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
      >
        <strong style={{ fontSize: 14 }}>Nueva cotización</strong>
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
        </div>
        <FilasItems
          items={items}
          productos={productos}
          campoMonto="precio_unitario"
          etiquetaMonto="Precio unitario"
          onChange={setItems}
          onProductoChange={handleProductoChange}
        />
        <label>
          Observaciones
          <textarea
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Validez de la oferta, condiciones de pago, tiempo de entrega..."
          />
        </label>
        <p style={{ fontSize: 14, fontWeight: 600 }}>
          Total: ${total.toLocaleString("es-CO")}
        </p>
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        <button className="boton" type="submit" disabled={enviando} style={{ alignSelf: "flex-start" }}>
          {enviando ? "Guardando..." : "Guardar cotización"}
        </button>
      </form>

      {ultimoGuardadoId && (
        <div className="no-print" style={{ marginTop: 12, padding: 12, borderRadius: "var(--radio)", background: "#f4f4f4", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 13 }}>Cotización {ultimoGuardadoId} guardada.</span>
          <button className="boton-secundario boton" onClick={() => window.print()}>
            Imprimir / Descargar PDF
          </button>
        </div>
      )}
    </div>
  );
}
