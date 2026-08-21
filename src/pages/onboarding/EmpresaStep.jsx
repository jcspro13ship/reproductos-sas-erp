import { useState } from "react";
import { extraerColoresDeImagen } from "../../lib/colores";

export default function EmpresaStep({ empresa, onChange, onColoresSugeridos }) {
  const [analizando, setAnalizando] = useState(false);
  const [errorLogo, setErrorLogo] = useState(null);

  function set(campo) {
    return (e) => onChange({ ...empresa, [campo]: e.target.value });
  }

  async function handleLogo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setAnalizando(true);
    setErrorLogo(null);
    try {
      const colores = await extraerColoresDeImagen(archivo);
      if (!colores) {
        setErrorLogo("No se pudieron detectar colores claros en esta imagen — ajústalos manualmente en el siguiente paso.");
        return;
      }
      onColoresSugeridos(colores);
    } catch (err) {
      setErrorLogo(err.message);
    } finally {
      setAnalizando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
      <h2 style={{ fontSize: 18 }}>Datos de la empresa</h2>
      <label>
        Nombre *
        <input value={empresa.nombre} onChange={set("nombre")} placeholder="Nombre del negocio" />
      </label>
      <label>
        NIT
        <input value={empresa.nit} onChange={set("nit")} placeholder="900123456-7" />
      </label>
      <label>
        Dirección
        <input value={empresa.direccion} onChange={set("direccion")} />
      </label>
      <label>
        Teléfono de contacto
        <input value={empresa.telefono} onChange={set("telefono")} />
      </label>
      <label>
        Email de contacto
        <input type="email" value={empresa.email} onChange={set("email")} />
      </label>
      <label>
        URL del logo
        <input
          value={empresa.logo_url}
          onChange={set("logo_url")}
          placeholder="Link de Drive/Imgur al logo ya subido"
        />
      </label>
      <label>
        Sugerir colores desde el logo (opcional)
        <input type="file" accept="image/*" onChange={handleLogo} />
        <span style={{ display: "block", fontSize: 11, opacity: 0.6, fontWeight: 400 }}>
          La imagen no se sube a ningún lado, solo se analiza en tu navegador para sugerir colores en el
          siguiente paso.
        </span>
      </label>
      {analizando && <p style={{ fontSize: 13, opacity: 0.7 }}>Analizando imagen...</p>}
      {errorLogo && <p style={{ fontSize: 13, color: "crimson" }}>{errorLogo}</p>}
    </div>
  );
}
