import { ROLES_PLANTILLA } from "../../lib/rolesPlantilla";

export default function ConfirmacionStep({ empresa, colores, usuarios }) {
  return (
    <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ fontSize: 18 }}>Confirmación</h2>

      <section>
        <strong style={{ fontSize: 14 }}>Empresa</strong>
        <ul style={{ fontSize: 14, marginTop: 6 }}>
          <li>{empresa.nombre || "(sin nombre)"}</li>
          <li>Moneda base: {empresa.moneda_base || "COP"}</li>
          {empresa.nit && <li>NIT: {empresa.nit}</li>}
          {empresa.direccion && <li>{empresa.direccion}</li>}
          {(empresa.telefono || empresa.email) && (
            <li>
              {empresa.telefono} {empresa.email}
            </li>
          )}
        </ul>
      </section>

      <section>
        <strong style={{ fontSize: 14 }}>Colores</strong>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <span style={{ background: colores.primario, color: "#fff", padding: "4px 10px", borderRadius: 4, fontSize: 12 }}>
            {colores.primario}
          </span>
          <span style={{ background: colores.secundario, color: "#000", padding: "4px 10px", borderRadius: 4, fontSize: 12 }}>
            {colores.secundario}
          </span>
        </div>
      </section>

      <section>
        <strong style={{ fontSize: 14 }}>Usuarios ({usuarios.length})</strong>
        <table style={{ marginTop: 6 }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => (
              <tr key={i}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{ROLES_PLANTILLA.find((r) => r.id === u.rol_id)?.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
