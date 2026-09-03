import { useState } from "react";
import { PRESETS_PERIODO, finDelDia } from "../lib/periodo";
import { parseFechaInput } from "../lib/fecha";

// Selector de período para el tablero: botones de presets (Este mes, Mes
// anterior, Este año, Todo) más un rango personalizado con dos fechas.
// `onCambiar` recibe { desde: Date|null, hasta: Date|null, etiqueta: string }.
export default function PeriodoSelector({ presetActivo, onCambiar }) {
  const [personalizado, setPersonalizado] = useState(false);
  const [desdeTexto, setDesdeTexto] = useState("");
  const [hastaTexto, setHastaTexto] = useState("");

  function elegirPreset(preset) {
    setPersonalizado(false);
    const [desde, hasta] = preset.rango();
    onCambiar({ desde, hasta, etiqueta: preset.etiqueta, presetId: preset.id });
  }

  function aplicarPersonalizado() {
    const desde = parseFechaInput(desdeTexto);
    const hastaBase = parseFechaInput(hastaTexto);
    const hasta = hastaBase ? finDelDia(hastaBase) : null;
    if (!desde && !hasta) return;
    const etiqueta = desde && hasta ? `${desdeTexto} a ${hastaTexto}` : desde ? `Desde ${desdeTexto}` : `Hasta ${hastaTexto}`;
    onCambiar({ desde, hasta, etiqueta, presetId: "personalizado" });
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
      {PRESETS_PERIODO.map((p) => (
        <button
          key={p.id}
          type="button"
          className={presetActivo === p.id ? "boton" : "boton-secundario boton"}
          onClick={() => elegirPreset(p)}
        >
          {p.etiqueta}
        </button>
      ))}
      <button
        type="button"
        className={presetActivo === "personalizado" ? "boton" : "boton-secundario boton"}
        onClick={() => setPersonalizado((v) => !v)}
      >
        Personalizado
      </button>

      {personalizado && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="date" value={desdeTexto} onChange={(e) => setDesdeTexto(e.target.value)} />
          <span style={{ fontSize: 13, opacity: 0.7 }}>a</span>
          <input type="date" value={hastaTexto} onChange={(e) => setHastaTexto(e.target.value)} />
          <button type="button" className="boton" onClick={aplicarPersonalizado}>
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
