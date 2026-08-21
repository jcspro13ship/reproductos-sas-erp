import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { calcularRentabilidadPorVenta, calcularValorInventario } from "../../lib/rentabilidad";
import { formatoMoneda } from "../../lib/formato";
import KpiCard from "../../components/KpiCard";

export default function Costos() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.list("PRODUCTOS"),
      api.list("VENTAS"),
      api.list("VENTAS_DETALLE"),
      api.list("MOVIMIENTOS_INVENTARIO"),
      api.list("CLIENTES"),
    ])
      .then(([productos, ventas, ventasDetalle, movimientos, clientes]) => {
        setDatos({
          valorInventario: calcularValorInventario(productos),
          rentabilidadVentas: calcularRentabilidadPorVenta(ventas, ventasDetalle, movimientos),
          clientes,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  const { valorInventario, rentabilidadVentas, clientes } = datos;
  const ingresoTotal = rentabilidadVentas.reduce((acc, r) => acc + r.ingreso, 0);
  const utilidadTotal = rentabilidadVentas.reduce((acc, r) => acc + r.utilidad, 0);
  const margenPromedio = ingresoTotal > 0 ? utilidadTotal / ingresoTotal : 0;

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Costos y rentabilidad</h1>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <KpiCard etiqueta="Valor de inventario (a costo)" valor={formatoMoneda(valorInventario)} />
        <KpiCard etiqueta="Utilidad de ventas registradas" valor={formatoMoneda(utilidadTotal)} />
        <KpiCard etiqueta="Margen promedio" valor={`${(margenPromedio * 100).toFixed(1)}%`} />
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Rentabilidad por venta</h2>
      {rentabilidadVentas.length === 0 ? (
        <p style={{ opacity: 0.7, fontSize: 14 }}>Todavía no hay ventas registradas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Venta</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Ingreso</th>
              <th>Costo</th>
              <th>Utilidad</th>
              <th>Margen</th>
            </tr>
          </thead>
          <tbody>
            {rentabilidadVentas.map(({ venta, ingreso, costo, utilidad, margen }) => (
              <tr key={venta.id}>
                <td>{venta.id}</td>
                <td>{clientes.find((c) => c.id === venta.cliente_id)?.nombre || venta.cliente_id}</td>
                <td>{venta.fecha}</td>
                <td>{formatoMoneda(ingreso)}</td>
                <td>{formatoMoneda(costo)}</td>
                <td style={{ color: utilidad < 0 ? "crimson" : "inherit" }}>{formatoMoneda(utilidad)}</td>
                <td>{(margen * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
