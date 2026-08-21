import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function TablaGenerica({ sheet, columnas, titulo }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <section>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>{titulo}</h1>
      {cargando && <p>Cargando...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!cargando && !error && filas.length === 0 && <p>No hay registros en {sheet} todavía.</p>}
      {!cargando && !error && filas.length > 0 && (
        <table>
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
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
