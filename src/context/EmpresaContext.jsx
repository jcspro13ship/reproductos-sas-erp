import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { TEMA_DEFAULT } from "../config";

// Se conoce de antemano (esta app es solo para Reproduuctos SAS, no es
// multi-cliente) — se usa como valor inicial para que el logo, el nombre y
// los colores salgan bien desde el primer render, sin esperar la respuesta
// del Sheet. Una vez esa respuesta llega, la reemplaza — así que si algún
// día se edita el nombre, el logo o los colores desde EMPRESA en el Sheet,
// se sigue actualizando solo, esto es solo para no mostrar nada genérico
// mientras tanto.
const EMPRESA_CONOCIDA = {
  id: "ej-1",
  nombre: "Reproduuctos SAS",
  nit: "901.901.143-1",
  logo_url: "https://drive.google.com/file/d/12Tw5efR9gu3TrdfTEwaO7TJ8BNmJwlM0/view?usp=sharing",
  color_primario: "#3FBFBA",
  color_secundario: "#F5A623",
  direccion: "Cra 7A 26 09",
  telefono: 3008002199,
  email: "equinoterapia23@gmail.com",
  moneda_base: "COP",
};

const EmpresaContext = createContext({ empresa: EMPRESA_CONOCIDA, cargando: true });

export function EmpresaProvider({ children }) {
  const [empresa, setEmpresa] = useState(EMPRESA_CONOCIDA);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    let intento = 0;
    const maxIntentos = 3;

    function cargar() {
      api
        .list("EMPRESA")
        .then((filas) => {
          if (!activo) return;
          // Si la fila viniera vacía por algún motivo, se mantiene el valor
          // conocido en vez de quedar sin nombre/logo/colores.
          const datos = filas[0] || EMPRESA_CONOCIDA;
          setEmpresa(datos);
          const raiz = document.documentElement.style;
          raiz.setProperty("--color-primario", datos?.color_primario || TEMA_DEFAULT.colorPrimario);
          raiz.setProperty("--color-secundario", datos?.color_secundario || TEMA_DEFAULT.colorSecundario);
          if (datos?.nombre) document.title = datos.nombre;
          setCargando(false);
        })
        .catch(() => {
          if (!activo) return;
          // Reintenta unas veces con espera creciente: si la primera carga
          // falla por un corte de red puntual o el Apps Script tardó en
          // "despertar", no se queda pegado mostrando el genérico sin logo.
          if (intento < maxIntentos) {
            intento += 1;
            setTimeout(cargar, intento * 2000);
          } else {
            setCargando(false);
          }
        });
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  return <EmpresaContext.Provider value={{ empresa, cargando }}>{children}</EmpresaContext.Provider>;
}

export function useEmpresa() {
  return useContext(EmpresaContext);
}
