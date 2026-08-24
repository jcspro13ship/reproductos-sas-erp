import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import TablaGenerica from "../../components/TablaGenerica";
import TablaEditable from "../../components/TablaEditable";

export default function Configuracion() {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    api.list("ROLES").then(setRoles);
  }, []);

  const opcionesRol = roles.map((r) => ({ value: r.id, label: r.nombre }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <TablaEditable
        titulo="Empresa"
        sheet="EMPRESA"
        columnas={[
          { key: "nombre", label: "Nombre" },
          { key: "nit", label: "NIT" },
          { key: "moneda_base", label: "Moneda base" },
          { key: "color_primario", label: "Color primario" },
          { key: "color_secundario", label: "Color secundario" },
        ]}
        campos={[
          { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
          { key: "nit", label: "NIT", tipo: "texto" },
          {
            key: "moneda_base",
            label: "Moneda base",
            tipo: "texto",
            requerido: true,
            ayuda: "Código de 3 letras (ISO 4217), ej: COP, USD, MXN. Es la moneda en la que quedan costo promedio, comisiones, CxC/CxP y reportes.",
          },
          { key: "color_primario", label: "Color primario", tipo: "texto" },
          { key: "color_secundario", label: "Color secundario", tipo: "texto" },
          { key: "direccion", label: "Dirección", tipo: "texto" },
          { key: "telefono", label: "Teléfono", tipo: "texto" },
          { key: "email", label: "Email", tipo: "texto" },
          { key: "logo_url", label: "URL del logo", tipo: "texto" },
        ]}
      />

      <TablaEditable
        titulo="Tasas de cambio"
        sheet="TASAS_CAMBIO"
        columnas={[
          { key: "id", label: "ID" },
          { key: "moneda", label: "Moneda" },
          { key: "nombre", label: "Nombre" },
          { key: "tasa", label: "Tasa (a moneda base)" },
          { key: "fecha_actualizacion", label: "Actualizada" },
        ]}
        campos={[
          { key: "moneda", label: "Código de moneda", tipo: "texto", requerido: true, ayuda: "Ej: USD, EUR" },
          { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
          {
            key: "tasa",
            label: "Tasa vigente",
            tipo: "numero",
            requerido: true,
            ayuda: "Cuántas unidades de la moneda base equivalen a 1 unidad de esta moneda. Cambiarla aquí no afecta compras/ventas ya registradas.",
          },
          { key: "fecha_actualizacion", label: "Fecha (DD-MM-AAAA)", tipo: "texto" },
        ]}
      />

      <TablaEditable
        titulo="Usuarios"
        sheet="USUARIOS"
        columnas={[
          { key: "id", label: "ID" },
          { key: "nombre", label: "Nombre" },
          { key: "email", label: "Email" },
          { key: "rol_id", label: "Rol" },
          { key: "activo", label: "Activo" },
        ]}
        campos={[
          { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
          { key: "email", label: "Email", tipo: "texto", requerido: true },
          { key: "clave", label: "Clave", tipo: "clave", ayuda: "Déjala en blanco al editar para no cambiarla" },
          { key: "rol_id", label: "Rol", tipo: "select", opciones: opcionesRol, requerido: true },
          {
            key: "activo",
            label: "Activo",
            tipo: "select",
            opciones: [
              { value: "true", label: "Sí" },
              { value: "false", label: "No" },
            ],
            requerido: true,
          },
        ]}
      />
      <TablaGenerica
        titulo="Roles"
        sheet="ROLES"
        columnas={[
          { key: "id", label: "ID" },
          { key: "nombre", label: "Nombre" },
        ]}
      />
    </div>
  );
}
