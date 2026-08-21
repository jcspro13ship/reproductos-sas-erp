import { useRef, useState } from "react";

export default function BloqueCopiable({ titulo, ayuda, texto }) {
  const [estado, setEstado] = useState("idle"); // idle | copiado | error
  const preRef = useRef(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setEstado("copiado");
    } catch {
      seleccionarTexto();
      setEstado("error");
    }
    setTimeout(() => setEstado("idle"), 2000);
  }

  function seleccionarTexto() {
    if (!preRef.current) return;
    const rango = document.createRange();
    rango.selectNodeContents(preRef.current);
    const seleccion = window.getSelection();
    seleccion.removeAllRanges();
    seleccion.addRange(rango);
  }

  return (
    <div style={{ border: "1px solid var(--color-borde)", borderRadius: "var(--radio)", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <strong style={{ fontSize: 14 }}>{titulo}</strong>
        <button className="boton-secundario boton" onClick={copiar}>
          {estado === "copiado" ? "Copiado" : estado === "error" ? "Selecciona y copia (⌘/Ctrl+C)" : "Copiar"}
        </button>
      </div>
      {ayuda && <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 10px" }}>{ayuda}</p>}
      <pre
        ref={preRef}
        onClick={seleccionarTexto}
        style={{
          background: "#fafafa",
          padding: 10,
          borderRadius: 6,
          fontSize: 12,
          overflowX: "auto",
          whiteSpace: "pre",
          cursor: "text",
        }}
      >
        {texto}
      </pre>
    </div>
  );
}
