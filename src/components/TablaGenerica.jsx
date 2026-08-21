import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { parseDDMMAAAA, parseFechaInput } from "../lib/fecha";
import { descargarCSV, filasACSV } from "../lib/csv";

export default function TablaGenerica({ sheet, columnas, titulo }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const columnaFecha = columnas.find((c) => c.key === "fecha")?.key || columnas.find((c) => c.key === "fecha_vencimiento")?.key;

  useEffect(() => {
    let activo = true;
    setCargando(true);
    api
      .list(sheet)
      .then((data) => activo && setFilas(data))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [sheet]);

  const filasFiltradas = useMemo(() => {
    if (!columnaFecha || (!desde && !hasta)) return filas;
    const fechaDesde = parseFechaInput(desde);
    const fechaHasta = parseFechaInput(hasta);
    return filas.filter((fila) => {
      const fecha = parseDDMMAAAA(fila[columnaFecha]);
      if (!fecha) return false;
      if (fechaDesde && fecha < fechaDesde) return false;
      if (fechaHasta && fecha > fechaHasta) return false;
      return true;
    });
  }, [filas, columnaFecha, desde, hasta]);

  function exportar() {
    descargarCSV(`${sheet.toLowerCase()}.csv`, filasACSV(filasFiltradas, columnas));
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 20 }}>{titulo}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {columnaFecha && (
            <>
              <label style={{ fontSize: 12 }}>
                Desde
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>
                Hasta
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </label>
            </>
          )}
          {filasFiltradas.length > 0 && (
            <button className="boton-secundario boton" onClick={exportar}>
              Exportar CSV
            </button>
          )}
        </div>
      </div>
      {cargando && <p>Cargando...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!cargando && !error && filasFiltradas.length === 0 && <p>No hay registros en {sheet} para este filtro.</p>}
      {!cargando && !error && filasFiltradas.length > 0 && (
        <table>
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.map((fila, i) => (
              <tr key={fila.id ?? i}>
                {columnas.map((c) => (
                  <td key={c.key}>{typeof fila[c.key] === "boolean" ? (fila[c.key] ? "Sí" : "No") : fila[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
