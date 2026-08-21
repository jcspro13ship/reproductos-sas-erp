import { ROLES_PLANTILLA } from "../../lib/rolesPlantilla";

export default function UsuariosStep({ usuarios, onChange }) {
  function actualizarUsuario(i, campo, valor) {
    onChange(usuarios.map((u, idx) => (idx === i ? { ...u, [campo]: valor } : u)));
  }

  function agregar() {
    onChange([...usuarios, { nombre: "", email: "", rol_id: "rol-1" }]);
  }

  function quitar(i) {
    onChange(usuarios.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 18, marginBottom: 4 }}>Usuarios iniciales</h2>
      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
        El primer usuario debe ser el administrador. Los roles vienen de la plantilla estándar
        (editable luego desde Configuración).
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {usuarios.map((u, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <label style={{ flex: 1 }}>
              Nombre
              <input value={u.nombre} onChange={(e) => actualizarUsuario(i, "nombre", e.target.value)} />
            </label>
            <label style={{ flex: 1 }}>
              Email
              <input
                type="email"
                value={u.email}
                onChange={(e) => actualizarUsuario(i, "email", e.target.value)}
              />
            </label>
            <label style={{ width: 180 }}>
              Rol
              <select value={u.rol_id} onChange={(e) => actualizarUsuario(i, "rol_id", e.target.value)}>
                {ROLES_PLANTILLA.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </label>
            {usuarios.length > 1 && (
              <button className="boton-secundario boton" onClick={() => quitar(i)}>
                Quitar
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="boton-secundario boton" style={{ marginTop: 12 }} onClick={agregar}>
        + Agregar usuario
      </button>
    </div>
  );
}
