import { useState } from "react";
import TablaGenerica from "../../components/TablaGenerica";
import NuevaVenta from "./NuevaVenta";

export default function Ventas() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <NuevaVenta onCreada={() => setRefreshKey((k) => k + 1)} />
      <TablaGenerica
        key={`cot-${refreshKey}`}
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
        key={`ven-${refreshKey}`}
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
