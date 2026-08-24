import { useState } from "react";
import { api } from "../lib/api";

export default function FormularioEntidad({ sheet, campos, valores, onGuardado, onCancelar }) {
  const esEdicion = Boolean(valores?.id);
  const [datos, setDatos] = useState(() => {
    const inicial = {};
    campos.forEach((c) => {
      const valor = valores?.[c.key];
      if (valor == null || c.tipo === "clave") {
        // La clave nunca se precarga en el formulario, ni siquiera al editar.
        inicial[c.key] = "";
      } else if (c.tipo === "porcentaje") {
        inicial[c.key] = String(Number(valor) * 100);
      } else {
        inicial[c.key] = String(valor);
      }
    });
    return inicial;
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  function set(key, valor) {
    setDatos((d) => ({ ...d, [key]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const payload = {};
      campos.forEach((c) => {
        const valor = datos[c.key];
        // Clave en blanco al editar: no se manda, así no se sobreescribe la existente.
        if (c.tipo === "clave" && esEdicion && valor === "") return;
        if (c.tipo === "numero") payload[c.key] = valor === "" ? 0 : Number(valor);
        else if (c.tipo === "porcentaje") payload[c.key] = valor === "" ? 0 : Number(valor) / 100;
        else payload[c.key] = valor;
      });
      if (esEdicion) {
        await api.update(sheet, valores.id, payload);
      } else {
        await api.create(sheet, payload);
      }
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: "1px solid var(--color-borde)",
        borderRadius: "var(--radio)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 480,
      }}
    >
      <strong style={{ fontSize: 14 }}>{esEdicion ? "Editar" : "Nuevo"}</strong>
      {campos.map((c) => (
        <label key={c.key}>
          {c.label}
          {c.tipo === "porcentaje" ? " (%)" : ""}
          {c.tipo === "select" ? (
            <select value={datos[c.key]} onChange={(e) => set(c.key, e.target.value)} required={c.requerido}>
              <option value="">Selecciona...</option>
              {c.opciones.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={c.tipo === "numero" || c.tipo === "porcentaje" ? "number" : c.tipo === "clave" ? "password" : "text"}
              step={c.tipo === "porcentaje" ? "0.1" : c.tipo === "numero" ? "any" : undefined}
              value={datos[c.key]}
              onChange={(e) => set(c.key, e.target.value)}
              required={c.requerido}
            />
          )}
          {c.ayuda && <span style={{ display: "block", fontSize: 11, opacity: 0.6, fontWeight: 400 }}>{c.ayuda}</span>}
        </label>
      ))}
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="boton" type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        <button className="boton-secundario boton" type="button" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
