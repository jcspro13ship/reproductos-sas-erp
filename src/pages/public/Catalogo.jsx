import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { fusionarPrecios, resolverListaPublica } from "../../lib/catalogo";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import ProductoCard from "../../components/ProductoCard";

export default function Catalogo() {
  const { cliente } = useClienteAuth();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([api.list("PRODUCTOS"), api.list("PRECIOS_PRODUCTO"), api.list("LISTAS_PRECIO")])
      .then(([productosData, precios, listas]) => {
        if (!activo) return;
        const listaId = cliente?.lista_precio_id || resolverListaPublica(listas)?.id;
        setProductos(fusionarPrecios(productosData, precios, listaId));
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [cliente]);

  if (cargando) return <p>Cargando catálogo...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Catálogo</h1>
      {cliente && <p style={{ fontSize: 13, opacity: 0.7 }}>Precios para {cliente.nombre}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {productos.map((p) => (
          <ProductoCard key={p.id} producto={p} />
        ))}
      </div>
    </div>
  );
}
