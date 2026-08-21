import TablaEditable from "../../components/TablaEditable";

export default function Proveedores() {
  return (
    <TablaEditable
      titulo="Proveedores"
      sheet="PROVEEDORES"
      columnas={[
        { key: "id", label: "ID" },
        { key: "nombre", label: "Nombre" },
        { key: "contacto", label: "Contacto" },
      ]}
      campos={[
        { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
        { key: "contacto", label: "Contacto", tipo: "texto" },
      ]}
    />
  );
}
