import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <div>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Nombre de la empresa</h1>
      <p style={{ maxWidth: 560, opacity: 0.8 }}>
        Espacio institucional: quiénes somos, propuesta de valor, misión y visión. Este
        contenido se personaliza por cliente durante el onboarding.
      </p>
      <Link to="/catalogo" className="boton" style={{ display: "inline-block", marginTop: 20, textDecoration: "none" }}>
        Ver catálogo
      </Link>
    </div>
  );
}
