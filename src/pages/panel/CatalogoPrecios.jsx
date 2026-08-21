import TablaGenerica from "../../components/TablaGenerica";

export default function CatalogoPrecios() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <TablaGenerica
        titulo="Listas de precio"
        sheet="LISTAS_PRECIO"
        columnas={[
          { key: "id", label: "ID" },
          { key: "nombre", label: "Nombre" },
        ]}
      />
      <TablaGenerica
        titulo="Precios por producto"
        sheet="PRECIOS_PRODUCTO"
        columnas={[
          { key: "producto_id", label: "Producto" },
          { key: "lista_id", label: "Lista" },
          { key: "precio", label: "Precio" },
        ]}
      />
    </div>
  );
}
