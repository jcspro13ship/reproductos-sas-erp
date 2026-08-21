import TablaGenerica from "../../components/TablaGenerica";

export default function Comisiones() {
  return (
    <TablaGenerica
      titulo="Comisiones"
      sheet="COMISIONES"
      columnas={[
        { key: "venta_id", label: "Venta" },
        { key: "vendedor_id", label: "Vendedor" },
        { key: "valor_comision", label: "Valor" },
        { key: "estado_pago", label: "Estado de pago" },
      ]}
    />
  );
}
