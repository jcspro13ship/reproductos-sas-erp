import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function CambiarClave() {
  const { sesion } = useAuth();
  const navigate = useNavigate();
  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (claveNueva !== confirmar) {
      setError("La confirmación no coincide con la clave nueva");
      return;
    }
    if (claveNueva.length < 4) {
      setError("La clave nueva debe tener al menos 4 caracteres");
      return;
    }
    setGuardando(true);
    try {
      await api.cambiarClave(sesion.usuario.email, claveActual, claveNueva);
      setListo(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ maxWidth: 360 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Cambiar mi clave</h1>

      {listo ? (
        <div>
          <p style={{ fontSize: 14, marginBottom: 16 }}>Tu clave se actualizó correctamente.</p>
          <button className="boton" onClick={() => navigate("/panel")}>
            Volver al panel
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            Clave actual
            <input
              type="password"
              required
              value={claveActual}
              onChange={(e) => setClaveActual(e.target.value)}
            />
          </label>
          <label>
            Clave nueva
            <input
              type="password"
              required
              value={claveNueva}
              onChange={(e) => setClaveNueva(e.target.value)}
            />
          </label>
          <label>
            Confirmar clave nueva
            <input
              type="password"
              required
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </label>
          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <button className="boton" type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar clave nueva"}
          </button>
        </form>
      )}
    </div>
  );
}
