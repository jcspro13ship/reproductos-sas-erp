import TablaGenerica from "../../components/TablaGenerica";

export default function Clientes() {
  return (
    <TablaGenerica
      titulo="Clientes"
      sheet="CLIENTES"
      columnas={[
        { key: "id", label: "ID" },
        { key: "nombre", label: "Nombre" },
        { key: "contacto", label: "Contacto" },
        { key: "lista_precio_id", label: "Lista de precio" },
      ]}
    />
  );
}
