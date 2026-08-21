import TablaGenerica from "../../components/TablaGenerica";

export default function Cartera() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <TablaGenerica
        titulo="Cuentas por cobrar (CxC)"
        sheet="CXC"
        columnas={[
          { key: "id", label: "ID" },
          { key: "cliente_id", label: "Cliente" },
          { key: "venta_id", label: "Venta" },
          { key: "saldo", label: "Saldo" },
          { key: "fecha_vencimiento", label: "Vence" },
        ]}
      />
      <TablaGenerica
        titulo="Cuentas por pagar (CxP)"
        sheet="CXP"
        columnas={[
          { key: "id", label: "ID" },
          { key: "proveedor_id", label: "Proveedor" },
          { key: "compra_id", label: "Compra" },
          { key: "saldo", label: "Saldo" },
          { key: "fecha_vencimiento", label: "Vence" },
        ]}
      />
    </div>
  );
}
