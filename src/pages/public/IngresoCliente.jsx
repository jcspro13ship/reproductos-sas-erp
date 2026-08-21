import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";

export default function IngresoCliente() {
  const { login, error } = useClienteAuth();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);
    try {
      await login(usuario, clave);
      navigate("/catalogo");
    } catch {
      // el error ya queda expuesto por el contexto
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth: 340, margin: "40px auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Ingresa con tu cuenta</h1>
      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>
        Si tienes usuario y clave asignados por el negocio, ingresa aquí para ver tus precios.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
        <input
          type="password"
          placeholder="Clave"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
        />
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        <button className="boton" type="submit" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
