import { useState } from "react";
import NuevaCompra from "./NuevaCompra";
import ComprasTabla from "./ComprasTabla";

export default function Compras() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <NuevaCompra onCreada={() => setRefreshKey((k) => k + 1)} />
      <ComprasTabla key={refreshKey} />
    </div>
  );
}
