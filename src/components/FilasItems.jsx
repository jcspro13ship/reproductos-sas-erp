import BuscadorSelect from "./BuscadorSelect";

export default function FilasItems({ items, productos, campoMonto, etiquetaMonto, onChange, onProductoChange }) {
  const opcionesProducto = productos.map((p) => ({ value: p.id, label: p.nombre }));

  function actualizar(i, campo, valor) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)));
  }

  function agregar() {
    onChange([...items, { producto_id: "", cantidad: 1, [campoMonto]: 0 }]);
  }

  function quitar(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <label style={{ flex: 2 }}>
            Producto
            <BuscadorSelect
              opciones={opcionesProducto}
              value={item.producto_id}
              onChange={(valor) => {
                actualizar(i, "producto_id", valor);
                onProductoChange?.(i, valor);
              }}
              placeholder="Escribe el nombre del producto..."
            />
          </label>
          <label style={{ width: 90 }}>
            Cantidad
            <input
              type="number"
              min="1"
              value={item.cantidad === 0 ? "" : item.cantidad}
              onFocus={(e) => e.target.select()}
              onChange={(e) => actualizar(i, "cantidad", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </label>
          <label style={{ width: 120 }}>
            {etiquetaMonto}
            <input
              type="number"
              min="0"
              value={item[campoMonto] === 0 ? "" : item[campoMonto]}
              onFocus={(e) => e.target.select()}
              onChange={(e) => actualizar(i, campoMonto, e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </label>
          {items.length > 1 && (
            <button type="button" className="boton-secundario boton" onClick={() => quitar(i)}>
              Quitar
            </button>
          )}
        </div>
      ))}
      <button type="button" className="boton-secundario boton" style={{ alignSelf: "flex-start" }} onClick={agregar}>
        + Agregar producto
      </button>
    </div>
  );
}
