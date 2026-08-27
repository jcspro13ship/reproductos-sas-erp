import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { TEMA_DEFAULT } from "../config";

const EmpresaContext = createContext({ empresa: null, cargando: true });

export function EmpresaProvider({ children }) {
  const [empresa, setEmpresa] = useState(null);
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
          const datos = filas[0] || null;
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
