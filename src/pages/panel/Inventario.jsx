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
          {
            key: "imagen",
            label: "Foto (link de Drive o Imgur)",
            tipo: "texto",
            ayuda: "Link normal de 'compartir' de Drive (debe estar en 'Cualquiera con el enlace') o de Imgur",
          },
          {
            key: "descripcion",
            label: "Descripción",
            tipo: "textoLargo",
            ayuda: "Se muestra en el detalle del producto del catálogo público",
          },
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
