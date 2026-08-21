import { useState } from "react";
import TablaGenerica from "../../components/TablaGenerica";
import NuevaVenta from "./NuevaVenta";
import CotizacionesTabla from "./CotizacionesTabla";

export default function Ventas() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <NuevaVenta onCreada={() => setRefreshKey((k) => k + 1)} />
      <CotizacionesTabla key={`cot-${refreshKey}`} onConvertida={() => setRefreshKey((k) => k + 1)} />
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
