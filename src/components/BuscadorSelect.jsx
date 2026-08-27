import { useEffect, useRef, useState } from "react";

// Selector con autocompletado propio: filtra las opciones por cualquier parte
// del texto (no solo el inicio, a diferencia del <datalist> nativo del
// navegador). Se comporta como un <select> para quien lo usa.
export default function BuscadorSelect({ opciones, value, onChange, placeholder, required }) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);
  const contenedorRef = useRef(null);

  // Solo depende de `value`, no de `opciones`: en FilasItems la lista de
  // opciones se recalcula en cada tecla que se escribe (nueva referencia de
  // array), y si el efecto dependiera de ella se disparse en cada tecla y
  // borraría lo que la persona acaba de escribir.
  useEffect(() => {
    const actual = opciones.find((o) => String(o.value) === String(value));
    setTexto(actual?.label || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function alHacerClicFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    return () => document.removeEventListener("mousedown", alHacerClicFuera);
  }, []);

  const filtro = texto.trim().toLowerCase();
  const filtradas = filtro ? opciones.filter((o) => o.label.toLowerCase().includes(filtro)) : opciones;
  const filtradasVisibles = filtradas.slice(0, 50);

  function elegir(opcion) {
    setTexto(opcion.label);
    onChange(opcion.value);
    setAbierto(false);
  }

  function handleChange(nuevoTexto) {
    setTexto(nuevoTexto);
    setAbierto(true);
    setResaltado(0);
    const match = opciones.find((o) => o.label === nuevoTexto);
    onChange(match ? match.value : "");
  }

  function handleKeyDown(e) {
    if (!abierto) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setResaltado((r) => Math.min(r + 1, filtradasVisibles.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setResaltado((r) => Math.max(r - 1, 0));
    } else if (e.key === "Enter") {
      if (filtradasVisibles[resaltado]) {
        e.preventDefault();
        elegir(filtradasVisibles[resaltado]);
      }
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  return (
    <div ref={contenedorRef} style={{ position: "relative" }}>
      <input
        value={texto}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={(e) => {
          e.target.select();
          setAbierto(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Escribe para buscar..."}
        required={required}
        autoComplete="off"
        style={{ width: "100%" }}
      />
      {abierto && filtradasVisibles.length > 0 && (
        <ul
          style={{
            position: "absolute",
            zIndex: 20,
            top: "100%",
            left: 0,
            right: 0,
            margin: 0,
            padding: 4,
            listStyle: "none",
            background: "var(--color-fondo, #fff)",
            border: "1px solid var(--color-borde)",
            borderRadius: "var(--radio)",
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          {filtradasVisibles.map((o, i) => (
            <li
              key={o.value}
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(o);
              }}
              onMouseEnter={() => setResaltado(i)}
              style={{
                padding: "6px 8px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                background: i === resaltado ? "var(--color-primario)" : "transparent",
                color: i === resaltado ? "#fff" : "inherit",
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
