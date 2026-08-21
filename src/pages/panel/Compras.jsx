import TablaGenerica from "../../components/TablaGenerica";

export default function Compras() {
  return (
    <TablaGenerica
      titulo="Compras"
      sheet="COMPRAS"
      columnas={[
        { key: "id", label: "ID" },
        { key: "proveedor_id", label: "Proveedor" },
        { key: "fecha", label: "Fecha" },
        { key: "estado", label: "Estado" },
      ]}
    />
  );
}
