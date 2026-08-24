import { useState } from "react";
import TablaGenerica from "../../components/TablaGenerica";
import NuevaVenta from "./NuevaVenta";
import NuevaCotizacion from "./NuevaCotizacion";
import CotizacionesTabla from "./CotizacionesTabla";
import CotizacionImprimible from "../../components/CotizacionImprimible";
import { useEmpresa } from "../../context/EmpresaContext";

export default function Ventas() {
  const { empresa } = useEmpresa();
  const [refreshKey, setRefreshKey] = useState(0);
  const [paraImprimir, setParaImprimir] = useState(null);

  function mostrarImprimible(datos) {
    setParaImprimir(datos);
  }

  function verImprimir(datos) {
    setParaImprimir(datos);
    setTimeout(() => window.print(), 300);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <NuevaCotizacion
        onGuardada={(datos) => {
          mostrarImprimible(datos);
          setRefreshKey((k) => k + 1);
        }}
      />
      <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <NuevaVenta onCreada={() => setRefreshKey((k) => k + 1)} />
        <CotizacionesTabla
          key={`cot-${refreshKey}`}
          onConvertida={() => setRefreshKey((k) => k + 1)}
          onVerImprimir={verImprimir}
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

      {paraImprimir && (
        <CotizacionImprimible
          empresa={empresa}
          cotizacion={paraImprimir.cotizacion}
          cliente={paraImprimir.cliente}
          lista={paraImprimir.lista}
          items={paraImprimir.items}
          notas={paraImprimir.notas}
        />
      )}
    </div>
  );
}
