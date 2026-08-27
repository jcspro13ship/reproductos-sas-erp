import { useEffect, useId, useState } from "react";

// Selector con autocompletado: el usuario escribe y filtra entre las opciones
// (usa <datalist>, así que el filtrado por texto lo hace el propio navegador).
// `opciones` es [{ value, label }]; se comporta como un <select> para quien lo usa.
export default function BuscadorSelect({ opciones, value, onChange, placeholder, required }) {
  const listId = useId();
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const actual = opciones.find((o) => String(o.value) === String(value));
    setTexto(actual?.label || "");
  }, [value, opciones]);

  function handleChange(nuevoTexto) {
    setTexto(nuevoTexto);
    const match = opciones.find((o) => o.label === nuevoTexto);
    onChange(match ? match.value : "");
  }

  return (
    <>
      <input
        list={listId}
        value={texto}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || "Escribe para buscar..."}
        required={required}
        autoComplete="off"
      />
      <datalist id={listId}>
        {opciones.map((o) => (
          <option key={o.value} value={o.label} />
        ))}
      </datalist>
    </>
  );
}
