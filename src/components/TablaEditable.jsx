import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { descargarCSV, filasACSV } from "../lib/csv";
import FormularioEntidad from "./FormularioEntidad";

export default function TablaEditable({ sheet, titulo, columnas, campos, onGuardado, permitirCrear = true, buscarEn }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null); // null cerrado, {} nuevo, {...fila} editar
  const [refreshKey, setRefreshKey] = useState(0);
  const [busqueda, setBusqueda] = useState("");

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
    onGuardado?.();
  }

  const filtro = busqueda.trim().toLowerCase();
  const filasFiltradas =
    buscarEn && filtro
      ? filas.filter((fila) => buscarEn.some((clave) => String(fila[clave] ?? "").toLowerCase().includes(filtro)))
      : filas;

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
          {permitirCrear && (
            <button className="boton" onClick={() => setEditando({})}>
              + Nuevo
            </button>
          )}
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

      {buscarEn && filas.length > 0 && (
        <input
          type="text"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ marginBottom: 12, maxWidth: 320 }}
        />
      )}

      {cargando && <p>Cargando...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!cargando && !error && filas.length === 0 && <p>No hay registros en {sheet} todavía.</p>}
      {!cargando && !error && filas.length > 0 && filasFiltradas.length === 0 && <p>No se encontraron resultados para "{busqueda}".</p>}
      {!cargando && !error && filasFiltradas.length > 0 && (
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
            {filasFiltradas.map((fila) => (
              <tr key={fila.id}>
                {columnas.map((c) => (
                  <td key={c.key}>
                    {c.render
                      ? c.render(fila)
                      : typeof fila[c.key] === "boolean"
                        ? fila[c.key]
                          ? "Sí"
                          : "No"
                        : fila[c.key]}
                  </td>
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
