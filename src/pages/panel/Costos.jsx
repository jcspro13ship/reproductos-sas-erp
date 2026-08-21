import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { calcularRentabilidadPorVenta, calcularValorInventario } from "../../lib/rentabilidad";
import { formatoMoneda } from "../../lib/formato";
import { parseDDMMAAAA, parseFechaInput } from "../../lib/fecha";
import { descargarCSV, filasACSV } from "../../lib/csv";
import KpiCard from "../../components/KpiCard";

const COLUMNAS_CSV = [
  { key: "id", label: "Venta" },
  { key: "cliente", label: "Cliente" },
  { key: "fecha", label: "Fecha" },
  { key: "ingreso", label: "Ingreso" },
  { key: "costo", label: "Costo" },
  { key: "utilidad", label: "Utilidad" },
  { key: "margen", label: "Margen %" },
];

export default function Costos() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

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

  const filtradas = useMemo(() => {
    if (!datos) return [];
    if (!desde && !hasta) return datos.rentabilidadVentas;
    const fechaDesde = parseFechaInput(desde);
    const fechaHasta = parseFechaInput(hasta);
    return datos.rentabilidadVentas.filter(({ venta }) => {
      const fecha = parseDDMMAAAA(venta.fecha);
      if (!fecha) return false;
      if (fechaDesde && fecha < fechaDesde) return false;
      if (fechaHasta && fecha > fechaHasta) return false;
      return true;
    });
  }, [datos, desde, hasta]);

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  const { valorInventario, clientes } = datos;
  const ingresoTotal = filtradas.reduce((acc, r) => acc + r.ingreso, 0);
  const utilidadTotal = filtradas.reduce((acc, r) => acc + r.utilidad, 0);
  const margenPromedio = ingresoTotal > 0 ? utilidadTotal / ingresoTotal : 0;

  function exportar() {
    const filas = filtradas.map(({ venta, ingreso, costo, utilidad, margen }) => ({
      id: venta.id,
      cliente: clientes.find((c) => c.id === venta.cliente_id)?.nombre || venta.cliente_id,
      fecha: venta.fecha,
      ingreso,
      costo,
      utilidad,
      margen: (margen * 100).toFixed(1),
    }));
    descargarCSV("rentabilidad_ventas.csv", filasACSV(filas, COLUMNAS_CSV));
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Costos y rentabilidad</h1>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <KpiCard etiqueta="Valor de inventario (a costo)" valor={formatoMoneda(valorInventario)} />
        <KpiCard etiqueta="Utilidad de ventas registradas" valor={formatoMoneda(utilidadTotal)} />
        <KpiCard etiqueta="Margen promedio" valor={`${(margenPromedio * 100).toFixed(1)}%`} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 16 }}>Rentabilidad por venta</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12 }}>
            Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label style={{ fontSize: 12 }}>
            Hasta
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          {filtradas.length > 0 && (
            <button className="boton-secundario boton" onClick={exportar}>
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p style={{ opacity: 0.7, fontSize: 14 }}>No hay ventas para este filtro.</p>
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
            {filtradas.map(({ venta, ingreso, costo, utilidad, margen }) => (
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
