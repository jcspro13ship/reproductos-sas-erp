import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { descargarCSV, filasACSV } from "../lib/csv";
import FormularioEntidad from "./FormularioEntidad";

export default function TablaEditable({ sheet, titulo, columnas, campos }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null); // null cerrado, {} nuevo, {...fila} editar
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [sheet, refreshKey]);

  function exportar() {
    descargarCSV(`${sheet.toLowerCase()}.csv`, filasACSV(filas, columnas));
  }

  function cerrarFormulario() {
    setEditando(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: 20 }}>{titulo}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {filas.length > 0 && (
            <button className="boton-secundario boton" onClick={exportar}>
              Exportar CSV
            </button>
          )}
          <button className="boton" onClick={() => setEditando({})}>
            + Nuevo
          </button>
        </div>
      </div>

      {editando && (
        <div style={{ marginBottom: 20 }}>
          <FormularioEntidad
            sheet={sheet}
            campos={campos}
            valores={editando.id ? editando : null}
            onGuardado={cerrarFormulario}
            onCancelar={() => setEditando(null)}
          />
        </div>
      )}

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.id}>
                {columnas.map((c) => (
                  <td key={c.key}>{typeof fila[c.key] === "boolean" ? (fila[c.key] ? "Sí" : "No") : fila[c.key]}</td>
                ))}
                <td>
                  <button className="boton-secundario boton" onClick={() => setEditando(fila)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
