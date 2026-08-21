import TablaGenerica from "../../components/TablaGenerica";

export default function Ventas() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <TablaGenerica
        titulo="Cotizaciones"
        sheet="COTIZACIONES"
        columnas={[
          { key: "id", label: "ID" },
          { key: "cliente_id", label: "Cliente" },
          { key: "vendedor_id", label: "Vendedor" },
          { key: "fecha", label: "Fecha" },
          { key: "estado", label: "Estado" },
        ]}
      />
      <TablaGenerica
        titulo="Ventas"
        sheet="VENTAS"
        columnas={[
          { key: "id", label: "ID" },
          { key: "cliente_id", label: "Cliente" },
          { key: "vendedor_id", label: "Vendedor" },
          { key: "fecha", label: "Fecha" },
          { key: "estado", label: "Estado" },
        ]}
      />
    </div>
  );
}
