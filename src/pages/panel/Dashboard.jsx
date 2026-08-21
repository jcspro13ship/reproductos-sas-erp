import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function Dashboard() {
  const { sesion } = useAuth();
  const [enNegativo, setEnNegativo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .list("PRODUCTOS")
      .then((productos) => setEnNegativo(productos.filter((p) => Number(p.stock_actual) < 0)))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Tablero de control</h1>
      <p style={{ opacity: 0.7, marginBottom: 20 }}>
        Hola {sesion?.usuario?.nombre}. Los demás KPIs por rol (ventas del día, cartera vencida)
        se definen en la siguiente fase de construcción.
      </p>

      <section>
        <strong style={{ fontSize: 14 }}>Inventario en negativo</strong>
        {cargando && <p style={{ fontSize: 13 }}>Cargando...</p>}
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        {!cargando && !error && enNegativo.length === 0 && (
          <p style={{ fontSize: 13, opacity: 0.7 }}>Ningún producto en negativo.</p>
        )}
        {enNegativo.length > 0 && (
          <table style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {enNegativo.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td style={{ color: "crimson", fontWeight: 600 }}>{p.stock_actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
