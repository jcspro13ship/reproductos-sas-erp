import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import TablaEditable from "../../components/TablaEditable";
import NuevoProducto from "./NuevoProducto";

export default function Inventario() {
  const [lineas, setLineas] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

  function cargarLineas() {
    api.list("LINEAS").then(setLineas);
  }

  useEffect(cargarLineas, []);

  const opcionesLinea = lineas.map((l) => ({ value: l.id, label: l.nombre }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <button className="boton" style={{ alignSelf: "flex-start" }} onClick={() => setMostrarNuevo((v) => !v)}>
        {mostrarNuevo ? "Cancelar" : "+ Crear nuevo producto"}
      </button>
      {mostrarNuevo && <NuevoProducto onCreado={() => setRefreshKey((k) => k + 1)} />}
      <TablaEditable
        key={refreshKey}
        titulo="Productos"
        sheet="PRODUCTOS"
        permitirCrear={false}
        columnas={[
          { key: "id", label: "ID" },
          { key: "nombre", label: "Producto" },
          { key: "linea_id", label: "Línea" },
          { key: "iva_pct", label: "IVA" },
          { key: "costo_promedio", label: "Costo promedio" },
          { key: "stock_actual", label: "Stock" },
          {
            key: "visible_catalogo",
            label: "Visible en catálogo",
            render: (fila) => (String(fila.visible_catalogo) === "false" ? "No" : "Sí"),
          },
        ]}
        campos={[
          { key: "nombre", label: "Nombre", tipo: "texto", requerido: true },
          { key: "linea_id", label: "Línea", tipo: "select", opciones: opcionesLinea, requerido: true },
          {
            key: "visible_catalogo",
            label: "Visible en catálogo",
            tipo: "select",
            opciones: [
              { value: "true", label: "Sí" },
              { value: "false", label: "No" },
            ],
            ayuda: "Si lo pones en 'No', deja de verse en el catálogo público, pero sigue disponible para compras y ventas.",
          },
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
