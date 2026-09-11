import BuscadorSelect from "./BuscadorSelect";

// Lista editable de "producto + cantidad" para armar la receta de un kit.
// Igual de simple que FilasItems, pero sin el campo de monto (un componente
// de kit no tiene precio propio, solo cuánto lleva).
export default function ComponentesKit({ componentes, productos, onChange }) {
  const opciones = productos.map((p) => ({ value: p.id, label: p.nombre }));

  function actualizar(i, campo, valor) {
    onChange(componentes.map((c, idx) => (idx === i ? { ...c, [campo]: valor } : c)));
  }

  function agregar() {
    onChange([...componentes, { producto_id: "", cantidad: 1 }]);
  }

  function quitar(i) {
    onChange(componentes.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {componentes.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <label style={{ flex: 2 }}>
            Producto
            <BuscadorSelect
              opciones={opciones}
              value={c.producto_id}
              onChange={(valor) => actualizar(i, "producto_id", valor)}
              placeholder="Escribe el nombre del producto..."
            />
          </label>
          <label style={{ width: 90 }}>
            Cantidad
            <input
              type="number"
              min="1"
              value={c.cantidad === 0 ? "" : c.cantidad}
              onFocus={(e) => e.target.select()}
              onChange={(e) => actualizar(i, "cantidad", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </label>
          {componentes.length > 1 && (
            <button type="button" className="boton-secundario boton" onClick={() => quitar(i)}>
              Quitar
            </button>
          )}
        </div>
      ))}
      <button type="button" className="boton-secundario boton" style={{ alignSelf: "flex-start" }} onClick={agregar}>
        + Agregar componente
      </button>
    </div>
  );
}
