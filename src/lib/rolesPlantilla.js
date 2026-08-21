// Plantilla estándar de 5 roles (ver ERP-configurable-estructura.md, sección 6).
// nivel_acceso colapsa matices de la tabla original (p. ej. "ver las suyas" vs
// "ver todas") al esquema PERMISOS_ROL {rol_id, modulo, nivel_acceso}; el filtrado
// por "solo mis propios registros" se resuelve en la app, no en este nivel.

export const ROLES_PLANTILLA = [
  { id: "rol-1", nombre: "Administrador" },
  { id: "rol-2", nombre: "Ventas" },
  { id: "rol-3", nombre: "Bodega/Inventario" },
  { id: "rol-4", nombre: "Compras" },
  { id: "rol-5", nombre: "Cartera/Contabilidad" },
];

const MODULOS = [
  "compras",
  "inventario",
  "ventas",
  "comisiones",
  "cxc",
  "cxp",
  "catalogo",
  "costos",
  "tablero",
  "configuracion",
];

const NIVELES_POR_ROL = {
  "rol-1": ["total", "total", "total", "ver", "total", "total", "total", "total", "total", "total"],
  "rol-2": ["ninguno", "ver", "total", "ver", "ver", "ninguno", "ver", "ninguno", "ver", "ninguno"],
  "rol-3": ["ver", "total", "ninguno", "ninguno", "ninguno", "ninguno", "ninguno", "ninguno", "ver", "ninguno"],
  "rol-4": ["total", "ver", "ninguno", "ninguno", "ninguno", "ver", "ninguno", "ver", "ver", "ninguno"],
  "rol-5": ["ver", "ninguno", "ver", "total", "total", "total", "ninguno", "ver", "ver", "ninguno"],
};

export const PERMISOS_PLANTILLA = ROLES_PLANTILLA.flatMap((rol) =>
  MODULOS.map((modulo, i) => ({
    rol_id: rol.id,
    modulo,
    nivel_acceso: NIVELES_POR_ROL[rol.id][i],
  }))
);
