import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { TEMA_DEFAULT } from "../config";

const EmpresaContext = createContext({ empresa: null, cargando: true });

export function EmpresaProvider({ children }) {
  const [empresa, setEmpresa] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .list("EMPRESA")
      .then((filas) => {
        const datos = filas[0] || null;
        setEmpresa(datos);
        const raiz = document.documentElement.style;
        raiz.setProperty("--color-primario", datos?.color_primario || TEMA_DEFAULT.colorPrimario);
        raiz.setProperty("--color-secundario", datos?.color_secundario || TEMA_DEFAULT.colorSecundario);
        if (datos?.nombre) document.title = datos.nombre;
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  return <EmpresaContext.Provider value={{ empresa, cargando }}>{children}</EmpresaContext.Provider>;
}

export function useEmpresa() {
  return useContext(EmpresaContext);
}
