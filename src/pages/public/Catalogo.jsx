import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { fusionarPrecios, resolverListaPublica } from "../../lib/catalogo";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import ProductoCard from "../../components/ProductoCard";

export default function Catalogo() {
  const { cliente } = useClienteAuth();
  const [productos, setProductos] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [lineaId, setLineaId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([api.list("PRODUCTOS"), api.list("PRECIOS_PRODUCTO"), api.list("LISTAS_PRECIO"), api.list("LINEAS")])
      .then(([productosData, precios, listas, lineasData]) => {
        if (!activo) return;
        const listaId = cliente?.lista_precio_id || resolverListaPublica(listas)?.id;
        setProductos(fusionarPrecios(productosData, precios, listaId));
        setLineas(lineasData);
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [cliente]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const visible = String(p.visible_catalogo) !== "false";
      const coincideLinea = !lineaId || p.linea_id === lineaId;
      const coincideBusqueda = !busqueda || p.nombre?.toLowerCase().includes(busqueda.toLowerCase());
      return visible && coincideLinea && coincideBusqueda;
    });
  }, [productos, lineaId, busqueda]);

  if (cargando) return <p>Cargando catálogo...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Catálogo</h1>
      {cliente && <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>Precios para {cliente.nombre}</p>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={lineaId} onChange={(e) => setLineaId(e.target.value)} style={{ minWidth: 160 }}>
          <option value="">Todas las líneas</option>
          {lineas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>
      </div>

      {productosFiltrados.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No hay productos que coincidan con el filtro.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {productosFiltrados.map((p) => (
            <ProductoCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
