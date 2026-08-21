import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login, cargando, error } = useAuth();
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    await login(email);
    navigate("/panel");
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Panel interno</h1>
      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>
        Ingresa con el correo registrado en USUARIOS.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          required
          placeholder="correo@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        <button className="boton" type="submit" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <Link to="/onboarding" style={{ display: "block", marginTop: 16, fontSize: 12, opacity: 0.6 }}>
        Onboarding de nuevo cliente (interno JCS)
      </Link>
    </div>
  );
}
