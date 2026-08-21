import TablaGenerica from "../../components/TablaGenerica";

export default function Proveedores() {
  return (
    <TablaGenerica
      titulo="Proveedores"
      sheet="PROVEEDORES"
      columnas={[
        { key: "id", label: "ID" },
        { key: "nombre", label: "Nombre" },
        { key: "contacto", label: "Contacto" },
      ]}
    />
  );
}
