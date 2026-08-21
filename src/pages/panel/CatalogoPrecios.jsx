import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import TablaEditable from "../../components/TablaEditable";

export default function CatalogoPrecios() {
  const [productos, setProductos] = useState([]);
  const [listas, setListas] = useState([]);

  useEffect(() => {
    api.list("PRODUCTOS").then(setProductos);
  }, []);

  function cargarListas() {
    api.list("LISTAS_PRECIO").then(setListas);
  }

  useEffect(cargarListas, []);

  const opcionesProducto = productos.map((p) => ({ value: p.id, label: p.nombre }));
  const opcionesLista = listas.map((l) => ({ value: l.id, label: l.nombre }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <TablaEditable
        titulo="Listas de precio"
        sheet="LISTAS_PRECIO"
        columnas={[
          { key: "id", label: "ID" },
          { key: "nombre", label: "Nombre" },
          { key: "moneda", label: "Moneda" },
        ]}
        campos={[
          { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
          { key: "moneda", label: "Moneda", tipo: "texto", requerido: true, ayuda: "Código de 3 letras, ej: COP, USD. Toda la lista queda en una sola moneda." },
        ]}
        onGuardado={cargarListas}
      />
      <TablaEditable
        titulo="Precios por producto"
        sheet="PRECIOS_PRODUCTO"
        columnas={[
          { key: "id", label: "ID" },
          { key: "producto_id", label: "Producto" },
          { key: "lista_id", label: "Lista" },
          { key: "precio", label: "Precio" },
        ]}
        campos={[
          { key: "producto_id", label: "Producto", tipo: "select", opciones: opcionesProducto, requerido: true },
          { key: "lista_id", label: "Lista de precio", tipo: "select", opciones: opcionesLista, requerido: true },
          { key: "precio", label: "Precio (incluye IVA, en la moneda de la lista)", tipo: "numero", requerido: true },
        ]}
      />
    </div>
  );
}
