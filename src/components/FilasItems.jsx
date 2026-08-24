export default function FilasItems({ items, productos, campoMonto, etiquetaMonto, onChange, onProductoChange }) {
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
            <select
              value={item.producto_id}
              onChange={(e) => {
                actualizar(i, "producto_id", e.target.value);
                onProductoChange?.(i, e.target.value);
              }}
            >
              <option value="">Selecciona...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label style={{ width: 90 }}>
            Cantidad
            <input
              type="number"
              min="1"
              value={item.cantidad}
              onChange={(e) => actualizar(i, "cantidad", Number(e.target.value))}
            />
          </label>
          <label style={{ width: 120 }}>
            {etiquetaMonto}
            <input
              type="number"
              min="0"
              value={item[campoMonto]}
              onChange={(e) => actualizar(i, campoMonto, Number(e.target.value))}
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
