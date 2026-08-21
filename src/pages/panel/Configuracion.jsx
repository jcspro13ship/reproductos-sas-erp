import TablaGenerica from "../../components/TablaGenerica";

export default function Configuracion() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <TablaGenerica
        titulo="Empresa"
        sheet="EMPRESA"
        columnas={[
          { key: "nombre", label: "Nombre" },
          { key: "nit", label: "NIT" },
          { key: "color_primario", label: "Color primario" },
          { key: "color_secundario", label: "Color secundario" },
        ]}
      />
      <TablaGenerica
        titulo="Usuarios"
        sheet="USUARIOS"
        columnas={[
          { key: "id", label: "ID" },
          { key: "nombre", label: "Nombre" },
          { key: "email", label: "Email" },
          { key: "rol_id", label: "Rol" },
          { key: "activo", label: "Activo" },
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
