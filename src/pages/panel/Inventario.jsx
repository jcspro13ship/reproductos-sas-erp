import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import TablaEditable from "../../components/TablaEditable";

export default function Inventario() {
  const [lineas, setLineas] = useState([]);

  function cargarLineas() {
    api.list("LINEAS").then(setLineas);
  }

  useEffect(cargarLineas, []);

  const opcionesLinea = lineas.map((l) => ({ value: l.id, label: l.nombre }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <TablaEditable
        titulo="Productos"
        sheet="PRODUCTOS"
        columnas={[
          { key: "id", label: "ID" },
          { key: "nombre", label: "Producto" },
          { key: "linea_id", label: "Línea" },
          { key: "iva_pct", label: "IVA" },
          { key: "costo_promedio", label: "Costo promedio" },
          { key: "stock_actual", label: "Stock" },
        ]}
        campos={[
          { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
          { key: "linea_id", label: "Línea", tipo: "select", opciones: opcionesLinea, requerido: true },
          { key: "iva_pct", label: "IVA", tipo: "porcentaje", ayuda: "0 para exento/excluido" },
          {
            key: "costo_promedio",
            label: "Costo promedio",
            tipo: "numero",
            ayuda: "Se recalcula solo con cada compra registrada — edítalo aquí solo para la carga inicial",
          },
          {
            key: "stock_actual",
            label: "Stock actual",
            tipo: "numero",
            ayuda: "Se descuenta/aumenta solo con ventas y compras — edítalo aquí solo para la carga inicial",
          },
        ]}
      />

      <TablaEditable
        titulo="Líneas de producto"
        sheet="LINEAS"
        columnas={[
          { key: "id", label: "ID" },
          { key: "nombre", label: "Nombre" },
          { key: "comision_default_pct", label: "% Comisión" },
        ]}
        campos={[
          { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
          { key: "comision_default_pct", label: "Comisión por defecto", tipo: "porcentaje", requerido: true },
        ]}
        onGuardado={cargarLineas}
      />
    </div>
  );
}
