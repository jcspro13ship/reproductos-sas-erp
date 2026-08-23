import { Fragment, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { hoyDDMMAAAA } from "../../lib/fecha";
import { formatoMoneda } from "../../lib/formato";

export default function TablaCartera({ sheet, referenciaTipo, titulo, columnas }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagando, setPagando] = useState(null); // id de la fila con el formulario de pago abierto
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoyDDMMAAAA());
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    setCargando(true);
    api
      .list(sheet)
      .then(setFilas)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [sheet]);

  function abrirPago(fila) {
    setPagando(fila.id);
    setMonto(String(fila.saldo));
    setFecha(hoyDDMMAAAA());
    setError(null);
  }

  async function confirmarPago(fila) {
    setEnviando(true);
    setError(null);
    try {
      await api.registrarPago({
        referencia_tipo: referenciaTipo,
        referencia_id: fila.id,
        monto: Number(monto),
        fecha,
      });
      setPagando(null);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <Fragment key={fila.id}>
                <tr>
                  {columnas.map((c) => (
                    <td key={c.key}>{c.key === "saldo" ? formatoMoneda(fila.saldo) : fila[c.key]}</td>
                  ))}
                  <td>
                    {Number(fila.saldo) > 0 ? (
                      <button className="boton-secundario boton" onClick={() => abrirPago(fila)}>
                        Registrar pago
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, opacity: 0.6 }}>Saldado</span>
                    )}
                  </td>
                </tr>
                {pagando === fila.id && (
                  <tr>
                    <td colSpan={columnas.length + 1}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "8px 0" }}>
                        <label>
                          Monto
                          <input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
                        </label>
                        <label>
                          Fecha
                          <input value={fecha} onChange={(e) => setFecha(e.target.value)} placeholder="DD-MM-AAAA" />
                        </label>
                        <button className="boton" disabled={enviando} onClick={() => confirmarPago(fila)}>
                          {enviando ? "Guardando..." : "Confirmar"}
                        </button>
                        <button className="boton-secundario boton" onClick={() => setPagando(null)}>
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
