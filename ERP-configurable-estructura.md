# ERP estándar configurable — Estructura y flujo del sistema

Documento de referencia técnica. Define la arquitectura, el modelo de datos, los flujos de proceso y las decisiones de diseño acordadas antes de iniciar la construcción del código.

## 1. Objetivo del sistema

Aplicación de gestión de negocio (tipo ERP ligero) que se pueda desplegar como **estándar configurable** para distintos negocios pequeños/medianos. Cada cliente parte de la misma base de código y modelo de datos, personalizada en el onboarding inicial (logo, datos de empresa, colores, usuarios).

Módulos: compras y gestión de compras, inventario, ventas y gestión de ventas, comisiones a vendedores por producto/línea, cuentas por cobrar, cuentas por pagar, tablero de control, informes generales, rentabilidad, costo de inventario, catálogo digital con carrito, cotizaciones y listas de precios.

## 2. Arquitectura general (3 capas)

```
Usuario / cliente
       │
   Onboarding (logo, colores, datos, usuarios)
       │
       ▼
Frontend — React sobre GitHub Pages
       │
       ▼
API — Google Apps Script (lógica de negocio)
       │
       ▼
Datos — Google Sheets (un Sheet por cliente)
```

- **Frontend**: React, desplegado en GitHub Pages. Repo independiente por cliente, creado a partir de un repo plantilla.
- **Backend / API**: Google Apps Script, expuesto como Web App (doGet/doPost), actúa como capa intermedia entre el frontend y el Sheet — evita exponer el Sheet directamente.
- **Datos**: Google Sheets, un archivo por cliente, con pestañas equivalentes a tablas relacionales.

**Límite conocido del modelo**: Google Sheets tiene cuotas (Apps Script ~6 min de ejecución, límites de llamadas diarias, ~10M celdas por Sheet). Válido para negocios pequeños/medianos; si un cliente crece mucho en volumen transaccional, se debe evaluar migrar a una base de datos real.

## 3. Modelo de datos (pestañas del Sheet)

**Entidades núcleo y relaciones:**

- `EMPRESA` — 1 registro. Datos de configuración: nombre, NIT, logo, colores, dirección, moneda_base (moneda en la que se llevan costo promedio, comisiones, CxC/CxP y reportes — configurable por negocio, no fija a COP).
- `USUARIOS` — usuarios del panel interno. Campos: id, nombre, email, rol_id, activo.
- `ROLES` — roles definidos por el negocio (configurable). Campos: id, nombre.
- `PERMISOS_ROL` — matriz de permisos. Campos: rol_id, módulo, nivel_acceso (ninguno / ver / editar / total).
- `TASAS_CAMBIO` — tasa vigente por moneda. Campos: id, moneda, nombre, tasa (cuántas unidades de moneda_base equivalen a 1 unidad de esa moneda), fecha_actualizacion. Es la tasa "actual", editable en cualquier momento — no es un histórico ni afecta compras/ventas ya registradas (ver sección 4/5).
- `LINEAS` — líneas de producto. Campos: id, nombre, % comisión por defecto.
- `PRODUCTOS` — catálogo de productos. Campos: id, nombre, línea_id, iva_pct (0 = exento/excluido), costo_promedio, stock_actual.
- `LISTAS_PRECIO` — listas de precio configurables por negocio. Campos: id, nombre (ej: público, mayorista, distribuidor), moneda (una lista completa está en una sola moneda, ej. "Mayorista USD").
- `PRECIOS_PRODUCTO` — matriz producto × lista. Campos: id, producto_id, lista_id, precio (incluye IVA — precio final al público, en la moneda de esa lista).
- `PROVEEDORES` — campos: id, nombre, contacto.
- `COMPRAS` — encabezado de orden de compra. Campos: id, proveedor_id, fecha, estado, moneda, tasa_cambio (tasa vigente al momento de registrar la compra, copiada de TASAS_CAMBIO y congelada en esta fila).
- `COMPRAS_DETALLE` — líneas de la compra. Campos: compra_id, producto_id, cantidad, costo_unitario (en la moneda de la compra, sin convertir).
- `MOVIMIENTOS_INVENTARIO` — entradas y salidas de inventario, referencia a compra o venta, usado para recalcular costo promedio. costo_unitario siempre queda en moneda_base (ya convertido), para que el costo promedio del producto sea comparable entre compras en distintas monedas.
- `CLIENTES` — campos: id, nombre, contacto, lista_precio_id, credencial (usuario/clave o link mágico, opcional).
- `COTIZACIONES` — mismo esquema que ventas, pero no afecta inventario hasta convertirse en venta.
- `VENTAS` — encabezado de venta. Campos: id, cliente_id, vendedor_id, fecha, estado, moneda, tasa_cambio (congelada igual que en COMPRAS).
- `VENTAS_DETALLE` — líneas de venta. Campos: venta_id, producto_id, cantidad, precio_unitario (en la moneda de la venta, sin convertir).
- `COMISIONES` — campos: venta_id, vendedor_id, valor_comisión, estado_pago.
- `CXC` — cuentas por cobrar. Campos: cliente_id, venta_id, saldo, fecha_vencimiento.
- `CXP` — cuentas por pagar. Campos: proveedor_id, compra_id, saldo, fecha_vencimiento.

## 4. Flujo de compras

1. **Orden de compra** — selecciona proveedor, moneda de la compra (si es distinta a moneda_base, la tasa vigente de `TASAS_CAMBIO` se propone automáticamente y se puede sobrescribir a mano) y productos con su costo en esa moneda.
2. **Recepción de mercancía** — verifica cantidades recibidas.
3. **Actualiza inventario** — el costo de cada línea se convierte a moneda_base (`costo_compra × tasa_cambio`) y ahí sí se recalcula el costo promedio ponderado:
   `nuevo_costo = (stock_actual × costo_actual + cantidad_comprada × costo_compra_convertido) / (stock_actual + cantidad_comprada)`
4. **Genera cuenta por pagar (CxP)** al proveedor, en moneda_base.
5. **Registra pago** — actualiza saldo de CxP (permite pagos parciales).

## 5. Flujo de ventas

1. **Cotización (opcional)** — se convierte en venta cuando el cliente confirma.
2. **Registra venta** — selecciona moneda de la venta (misma lógica de tasa propuesta/editable que en compras), verifica stock disponible. **Se permite venta con inventario en negativo** (backorder); el sistema no bloquea, solo debe alertar visualmente en el tablero de control cuando un producto queda en negativo.
3. **Descuenta inventario** al costo promedio ponderado vigente (siempre en moneda_base) — esto calcula automáticamente la rentabilidad real de cada venta, convirtiendo el ingreso de la venta a moneda_base con su tasa_cambio para que sea comparable contra el costo.
4. **Calcula comisión** del vendedor, sobre el **valor de venta (ingreso) convertido a moneda_base**, según el % configurado por línea de producto — así el vendedor siempre cobra en la moneda local del negocio, sin importar en qué moneda se facturó la venta.
5. **Genera cuenta por cobrar (CxC)** al cliente, en moneda_base.

**Nota sobre tasas de cambio**: la tasa que queda grabada en cada COMPRAS/VENTAS es una foto fija del momento del registro. Actualizar la tasa vigente en `TASAS_CAMBIO` después nunca modifica compras/ventas ya registradas — solo aplica como valor propuesto para las siguientes.

## 6. Roles y permisos

**Los roles y permisos son configurables por cada negocio** (no un set fijo global). Al crear un negocio nuevo, se copia una **plantilla estándar de 5 roles** que el administrador puede editar, agregar o ajustar módulo por módulo.

Plantilla base:

| Módulo | Administrador | Ventas | Bodega/Inventario | Compras | Cartera/Contabilidad |
|---|---|---|---|---|---|
| Compras (crear/recibir) | Total | — | Ver | Total | Ver |
| Inventario (ajustes, stock) | Total | Ver | Total | Ver | — |
| Ventas / cotizaciones | Total | Total (las suyas) | — | — | Ver |
| Comisiones | Ver todas | Ver las suyas | — | — | Total (liquidar) |
| CxC (cartera clientes) | Total | Ver las suyas | — | — | Total |
| CxP (proveedores) | Total | — | — | Ver | Total |
| Catálogo / precios | Total | Ver | — | — | — |
| Costos / rentabilidad | Total | **Sin acceso** | — | Ver costos | Ver |
| Tablero de control | Total | Su propio desempeño | Inventario | Compras | Financiero |
| Configuración / usuarios | Total | — | — | — | — |

Reglas clave: los vendedores nunca ven costo ni rentabilidad, solo precio de venta y su propia comisión; cada vendedor ve únicamente sus propias ventas/cotizaciones/cartera (salvo el administrador, que ve todo).

## 7. Wizard de onboarding

1. **Datos de empresa** — nombre, NIT, logo, contacto.
2. **Colores de marca** — genera el tema visual del panel y del catálogo.
3. **Usuarios iniciales** — se crean y se les asigna rol.
4. **Confirmación** — revisión final antes de crear.
5. **Provisión automática del sistema**:
   - Copia el Sheet plantilla (todas las pestañas del modelo de datos).
   - Escribe en `EMPRESA` los datos, logo y colores capturados.
   - Crea el usuario administrador en `USUARIOS`.
   - Copia el repo plantilla de GitHub, lo despliega en GitHub Pages, y lo conecta al Sheet vía Apps Script.

**Decisiones de infraestructura (fase actual):**
- El Google Sheet de cada cliente se crea y queda en el **Drive del usuario (JCS)**, no en el del cliente — se comparte acceso al cliente después.
- El repositorio de GitHub de cada cliente se crea siempre bajo la **cuenta/organización de GitHub del usuario (JCS)**.
- (Pendiente para una fase futura: variante donde el Sheet quede directamente en el Drive del cliente vía OAuth, sin romper el estándar actual.)

## 8. Catálogo digital y carrito

Pieza pública, separada del panel interno administrativo. Conectada directamente a `PRODUCTOS` y `PRECIOS_PRODUCTO`.

1. **Accede al catálogo** — link público, sin login.
2. **Explora productos** — precio mostrado según el modo (ver abajo).
3. **Agrega al carrito** — selecciona cantidades.
4. **Genera cotización** — se guarda en `COTIZACIONES`.
5. **Envía por WhatsApp** — el vendedor recibe la cotización y cierra la venta manualmente en el panel (o la convierte directamente).

**Modo dual de precios:**
- **Modo público (por defecto)**: cualquiera con el link ve la lista de precios pública.
- **Modo cliente identificado**: el cliente inicia sesión con usuario/credencial; el sistema lee su `lista_precio_id` en `CLIENTES` y recalcula los precios del catálogo según su lista asignada (mayorista, distribuidor, etc.). Login liviano — no es el mismo sistema de autenticación del panel administrativo interno.

Nota: el cierre de venta desde una cotización de WhatsApp no está integrado con pasarela de pago — sigue el patrón ya usado en otros proyectos (carrito → WhatsApp → el negocio envía el link de pago manualmente para cerrar la venta).

## 9. Puntos abiertos para definir durante la construcción

- Diseño detallado de pantallas del tablero de control (qué KPIs exactos por rol).
- Estructura de reportes exportables (formato, filtros).
- Mecanismo exacto de la credencial liviana de `CLIENTES` para el catálogo (usuario/clave vs. link mágico).
- Variante de Sheet en Drive del cliente (fase futura).
