import TablaGenerica from "../../components/TablaGenerica";

export default function Inventario() {
  return (
    <TablaGenerica
      titulo="Inventario"
      sheet="PRODUCTOS"
      columnas={[
        { key: "id", label: "ID" },
        { key: "nombre", label: "Producto" },
        { key: "linea_id", label: "Línea" },
        { key: "costo_promedio", label: "Costo promedio" },
        { key: "stock_actual", label: "Stock" },
      ]}
    />
  );
}
