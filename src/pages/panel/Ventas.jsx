import { useState } from "react";
import NuevaVenta from "./NuevaVenta";
import NuevaCotizacion from "./NuevaCotizacion";
import CotizacionesTabla from "./CotizacionesTabla";
import VentasTabla from "./VentasTabla";
import CotizacionImprimible from "../../components/CotizacionImprimible";
import VentaImprimible from "../../components/VentaImprimible";
import { useEmpresa } from "../../context/EmpresaContext";

export default function Ventas() {
  const { empresa } = useEmpresa();
  const [refreshKey, setRefreshKey] = useState(0);
  const [cotizacionParaImprimir, setCotizacionParaImprimir] = useState(null);
  const [ventaParaImprimir, setVentaParaImprimir] = useState(null);

  function mostrarCotizacion(datos) {
    setVentaParaImprimir(null);
    setCotizacionParaImprimir(datos);
  }

  function verImprimirCotizacion(datos) {
    setVentaParaImprimir(null);
    setCotizacionParaImprimir(datos);
    setTimeout(() => window.print(), 300);
  }

  function verImprimirVenta(datos) {
    setCotizacionParaImprimir(null);
    setVentaParaImprimir(datos);
    setTimeout(() => window.print(), 300);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <NuevaCotizacion
        onGuardada={(datos) => {
          mostrarCotizacion(datos);
          setRefreshKey((k) => k + 1);
        }}
      />
      <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <NuevaVenta onCreada={() => setRefreshKey((k) => k + 1)} />
        <CotizacionesTabla
          key={`cot-${refreshKey}`}
          onConvertida={() => setRefreshKey((k) => k + 1)}
          onVerImprimir={verImprimirCotizacion}
        />
        <VentasTabla key={`ven-${refreshKey}`} onVerImprimir={verImprimirVenta} />
      </div>

      {cotizacionParaImprimir && (
        <CotizacionImprimible
          empresa={empresa}
          cotizacion={cotizacionParaImprimir.cotizacion}
          cliente={cotizacionParaImprimir.cliente}
          lista={cotizacionParaImprimir.lista}
          items={cotizacionParaImprimir.items}
          notas={cotizacionParaImprimir.notas}
          totalUsd={cotizacionParaImprimir.totalUsd}
        />
      )}

      {ventaParaImprimir && (
        <VentaImprimible
          empresa={empresa}
          venta={ventaParaImprimir.venta}
          cliente={ventaParaImprimir.cliente}
          items={ventaParaImprimir.items}
        />
      )}
    </div>
  );
}
