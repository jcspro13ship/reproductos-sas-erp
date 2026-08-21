import BloqueCopiable from "../../components/BloqueCopiable";
import { filasATSV } from "../../lib/tsv";
import { ROLES_PLANTILLA, PERMISOS_PLANTILLA } from "../../lib/rolesPlantilla";

const COLS_EMPRESA = ["id", "nombre", "nit", "logo_url", "color_primario", "color_secundario", "direccion", "telefono", "email"];
const COLS_USUARIOS = ["id", "nombre", "email", "rol_id", "activo"];
const COLS_ROLES = ["id", "nombre"];
const COLS_PERMISOS = ["rol_id", "modulo", "nivel_acceso"];

export default function ResultadoStep({ empresa, colores, usuarios }) {
  const filaEmpresa = [
    {
      id: "ej-1",
      nombre: empresa.nombre,
      nit: empresa.nit,
      logo_url: empresa.logo_url,
      color_primario: colores.primario,
      color_secundario: colores.secundario,
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      email: empresa.email,
    },
  ];

  const filasUsuarios = usuarios.map((u, i) => ({
    id: `u-${i + 1}`,
    nombre: u.nombre,
    email: u.email,
    rol_id: u.rol_id,
    activo: "TRUE",
  }));

  const slug = (empresa.nombre || "cliente")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
      <div>
        <h2 style={{ fontSize: 18 }}>Datos listos para pegar en el Sheet</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Cada bloque trae las columnas en el mismo orden que la pestaña. Pega empezando en la
          fila donde está la fila de ejemplo (id "ej-") y bórrala.
        </p>
      </div>

      <BloqueCopiable titulo="EMPRESA (1 fila)" texto={filasATSV(filaEmpresa, COLS_EMPRESA)} />
      <BloqueCopiable titulo={`USUARIOS (${filasUsuarios.length} fila/s)`} texto={filasATSV(filasUsuarios, COLS_USUARIOS)} />
      <BloqueCopiable
        titulo="ROLES (5 filas — plantilla estándar)"
        texto={filasATSV(ROLES_PLANTILLA, COLS_ROLES)}
      />
      <BloqueCopiable
        titulo="PERMISOS_ROL (50 filas — matriz de la plantilla estándar)"
        ayuda="Editable después desde Configuración si el negocio necesita ajustar algún módulo."
        texto={filasATSV(PERMISOS_PLANTILLA, COLS_PERMISOS)}
      />

      <div>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Checklist de provisión manual</h2>
        <ol style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 8, paddingLeft: 20 }}>
          <li>
            Duplica <code>docs/ERP_Sheet_Plantilla.xlsx</code> en Drive (o "Archivo → Crear una
            copia" si ya lo convertiste a Google Sheets) y renómbralo{" "}
            <strong>{empresa.nombre || "Cliente"} — ERP</strong>.
          </li>
          <li>Pega los 4 bloques de arriba en sus pestañas y borra las filas de ejemplo restantes.</li>
          <li>
            En ese Sheet: Extensiones → Apps Script → pega el contenido de{" "}
            <code>apps-script/Code.gs</code> → Implementar → Nueva implementación → Aplicación
            web (Ejecutar como: yo, Acceso: cualquiera) → copia la URL del Web App.
          </li>
          <li>
            Crea un repo en GitHub a partir de la plantilla <code>erp-core-template</code>,
            nómbralo <code>{slug || "cliente"}-erp</code>.
          </li>
          <li>
            En el repo nuevo, crea <code>.env.local</code> con <code>VITE_API_URL</code> apuntando
            a la URL del Web App copiada arriba.
          </li>
          <li>
            Activa GitHub Pages (Settings → Pages) y corre <code>npm run deploy</code>.
          </li>
          <li>Si el cliente tiene dominio propio, apúntalo al sitio publicado en Pages.</li>
          <li>Comparte el Sheet con el correo del cliente cuando el sitio esté validado.</li>
        </ol>
      </div>
    </div>
  );
}
