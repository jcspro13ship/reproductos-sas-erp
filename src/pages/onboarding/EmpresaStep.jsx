export default function EmpresaStep({ empresa, onChange }) {
  function set(campo) {
    return (e) => onChange({ ...empresa, [campo]: e.target.value });
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
    </div>
  );
}
