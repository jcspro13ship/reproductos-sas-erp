import { useState } from "react";
import EmpresaStep from "./EmpresaStep";
import ColoresStep from "./ColoresStep";
import UsuariosStep from "./UsuariosStep";
import ConfirmacionStep from "./ConfirmacionStep";
import ResultadoStep from "./ResultadoStep";
import { TEMA_DEFAULT } from "../../config";

const PASOS = ["Empresa", "Colores", "Usuarios", "Confirmación", "Resultado"];

export default function Onboarding() {
  const [paso, setPaso] = useState(0);
  const [empresa, setEmpresa] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    email: "",
    logo_url: "",
  });
  const [colores, setColores] = useState({
    primario: TEMA_DEFAULT.colorPrimario,
    secundario: TEMA_DEFAULT.colorSecundario,
  });
  const [usuarios, setUsuarios] = useState([{ nombre: "", email: "", rol_id: "rol-1" }]);

  const puedeAvanzar = paso !== 0 || empresa.nombre.trim().length > 0;
  const esUltimoPaso = paso === PASOS.length - 1;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Onboarding de nuevo cliente</h1>
      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 24 }}>
        Uso interno de JCS Emprende — junta los datos para provisionar un cliente nuevo del ERP.
      </p>

      <ol style={{ display: "flex", gap: 8, fontSize: 12, padding: 0, listStyle: "none", marginBottom: 24 }}>
        {PASOS.map((label, i) => (
          <li
            key={label}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: i === paso ? "var(--color-primario)" : "#eee",
              color: i === paso ? "#fff" : "#333",
            }}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {paso === 0 && <EmpresaStep empresa={empresa} onChange={setEmpresa} onColoresSugeridos={setColores} />}
      {paso === 1 && <ColoresStep colores={colores} onChange={setColores} />}
      {paso === 2 && <UsuariosStep usuarios={usuarios} onChange={setUsuarios} />}
      {paso === 3 && <ConfirmacionStep empresa={empresa} colores={colores} usuarios={usuarios} />}
      {paso === 4 && <ResultadoStep empresa={empresa} colores={colores} usuarios={usuarios} />}

      <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
        {paso > 0 && (
          <button className="boton-secundario boton" onClick={() => setPaso((p) => p - 1)}>
            Atrás
          </button>
        )}
        {!esUltimoPaso && (
          <button className="boton" disabled={!puedeAvanzar} onClick={() => setPaso((p) => p + 1)}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
