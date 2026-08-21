import { useState } from "react";
import TablaGenerica from "../../components/TablaGenerica";
import NuevaCompra from "./NuevaCompra";

export default function Compras() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <NuevaCompra onCreada={() => setRefreshKey((k) => k + 1)} />
      <TablaGenerica
        key={refreshKey}
        titulo="Compras"
        sheet="COMPRAS"
        columnas={[
          { key: "id", label: "ID" },
          { key: "proveedor_id", label: "Proveedor" },
          { key: "fecha", label: "Fecha" },
          { key: "estado", label: "Estado" },
        ]}
      />
    </div>
  );
}
