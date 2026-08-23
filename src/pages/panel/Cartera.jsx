import TablaCartera from "./TablaCartera";

export default function Cartera() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <TablaCartera
        titulo="Cuentas por cobrar (CxC)"
        sheet="CXC"
        referenciaTipo="cxc"
        columnas={[
          { key: "id", label: "ID" },
          { key: "cliente_id", label: "Cliente" },
          { key: "venta_id", label: "Venta" },
          { key: "saldo", label: "Saldo" },
          { key: "fecha_vencimiento", label: "Vence" },
        ]}
      />
      <TablaCartera
        titulo="Cuentas por pagar (CxP)"
        sheet="CXP"
        referenciaTipo="cxp"
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
