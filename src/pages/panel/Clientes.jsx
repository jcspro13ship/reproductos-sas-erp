import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import TablaEditable from "../../components/TablaEditable";

export default function Clientes() {
  const [listas, setListas] = useState([]);

  useEffect(() => {
    api.list("LISTAS_PRECIO").then(setListas);
  }, []);

  const opcionesLista = listas.map((l) => ({ value: l.id, label: l.nombre }));

  return (
    <TablaEditable
      titulo="Clientes"
      sheet="CLIENTES"
      columnas={[
        { key: "id", label: "ID" },
        { key: "nombre", label: "Nombre" },
        { key: "contacto", label: "Contacto" },
        { key: "lista_precio_id", label: "Lista de precio" },
      ]}
      campos={[
        { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
        { key: "contacto", label: "Contacto", tipo: "texto" },
        { key: "lista_precio_id", label: "Lista de precio", tipo: "select", opciones: opcionesLista, requerido: true },
        { key: "usuario", label: "Usuario (catálogo)", tipo: "texto", ayuda: "Para que el cliente vea sus precios en el catálogo, opcional" },
        { key: "clave", label: "Clave (catálogo)", tipo: "clave", ayuda: "Opcional" },
      ]}
    />
  );
}
