import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { sesion } = useAuth();
  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Tablero de control</h1>
      <p style={{ opacity: 0.7 }}>
        Hola {sesion?.usuario?.nombre}. Los KPIs por rol (ventas del día, inventario en negativo,
        cartera vencida) se definen en la siguiente fase de construcción.
      </p>
    </div>
  );
}
