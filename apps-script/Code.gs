// Este script se pega en Extensiones > Apps Script del Google Sheet del cliente
// (una copia del Sheet plantilla en docs/ERP_Sheet_Plantilla.xlsx) y se publica
// como Web App (Ejecutar como: yo / Acceso: cualquiera). Sirve como API genérica:
// lee y escribe cualquier pestaña del modelo de datos sin necesitar un endpoint
// por tabla. Ver ERP-configurable-estructura.md para el modelo de datos completo.
//
// GET  ?action=list&sheet=PRODUCTOS
// GET  ?action=get&sheet=PRODUCTOS&id=p-1
// POST { action: "create"|"update"|"delete", sheet, id, data }
// POST { action: "login", email, clave }
// POST { action: "loginCliente", data: { usuario, clave } }
// POST { action: "cambiarClave", email, claveActual, claveNueva }
// POST { action: "recibirCompra", data: { proveedor_id, fecha, estado, numero_factura, plazo_dias,
//        fecha_vencimiento, moneda, tasa_cambio, items: [{ producto_id, cantidad, costo_unitario }] } }
// POST { action: "registrarVenta", data: { cliente_id, vendedor_id, fecha, estado, numero_factura,
//        plazo_dias, fecha_vencimiento, pagada, moneda, tasa_cambio,
//        items: [{ producto_id, cantidad, precio_unitario }] } }
// moneda/tasa_cambio son opcionales: si se omiten, se asume tasa_cambio=1 (ya en moneda_base).
// pagada=true registra de una vez el cobro completo (evita el paso aparte en Cartera).
// El id de VENTAS es un consecutivo alfanumérico (RP001, RP002...), ver generarConsecutivoVenta().
// POST { action: "registrarPago", data: { referencia_tipo: "cxc"|"cxp", referencia_id, monto, fecha } }
// POST { action: "marcarComisionPagada", data: { venta_id } }
// COMISIONES no tiene columna id (por eso no se puede usar el update/delete genérico ahí);
// esta acción ubica la fila por venta_id directamente.

function doGet(e) {
  try {
    var accion = e.parameter.action
    var sheetName = e.parameter.sheet

    if (accion === 'list') {
      return responder({ ok: true, data: leerTodo(sheetName) })
    }
    if (accion === 'get') {
      var fila = buscarPorId(sheetName, e.parameter.id)
      if (!fila) return responder({ ok: false, error: 'No encontrado' })
      return responder({ ok: true, data: fila })
    }
    return responder({ ok: false, error: 'Acción GET no reconocida: ' + accion })
  } catch (err) {
    return responder({ ok: false, error: String(err) })
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents)
    var accion = body.action
    var sheetName = body.sheet

    if (accion === 'create' || accion === 'update' || accion === 'delete') {
      var lock = LockService.getScriptLock()
      lock.waitLock(10000)
      try {
        if (accion === 'create') {
          return responder({ ok: true, data: crearFila(sheetName, body.data || {}) })
        }
        if (accion === 'update') {
          var actualizado = actualizarFila(sheetName, body.id, body.data || {})
          if (!actualizado) return responder({ ok: false, error: 'No encontrado' })
          return responder({ ok: true, data: actualizado })
        }
        var borrado = borrarFila(sheetName, body.id)
        return responder({ ok: true, data: { borrado: borrado } })
      } finally {
        lock.releaseLock()
      }
    }
    if (accion === 'login') {
      return responder(login(body.email, body.clave))
    }
    if (accion === 'loginCliente') {
      return responder(loginCliente(body.usuario, body.clave))
    }
    if (accion === 'cambiarClave') {
      return responder(cambiarClave(body.email, body.claveActual, body.claveNueva))
    }
    if (accion === 'recibirCompra') {
      return responder({ ok: true, data: recibirCompra(body.data || {}) })
    }
    if (accion === 'registrarVenta') {
      return responder({ ok: true, data: registrarVenta(body.data || {}) })
    }
    if (accion === 'registrarPago') {
      return responder(registrarPago(body.data || {}))
    }
    if (accion === 'marcarComisionPagada') {
      return responder(marcarComisionPagada(body.data || {}))
    }
    return responder({ ok: false, error: 'Acción POST no reconocida: ' + accion })
  } catch (err) {
    return responder({ ok: false, error: String(err) })
  }
}

function login(email, clave) {
  if (!email) return { ok: false, error: 'Falta el correo' }
  var usuarios = leerTodo('USUARIOS')
  var usuario = usuarios.find(function (u) {
    return String(u.email).toLowerCase() === String(email).toLowerCase()
  })
  if (!usuario || !esVerdadero(usuario.activo)) {
    return { ok: false, error: 'Usuario no encontrado o inactivo' }
  }
  if (!usuario.clave || String(usuario.clave) !== String(clave || '')) {
    return { ok: false, error: 'Clave incorrecta' }
  }
  var roles = leerTodo('ROLES')
  var rol = roles.find(function (r) {
    return String(r.id) === String(usuario.rol_id)
  })
  var permisos = leerTodo('PERMISOS_ROL').filter(function (p) {
    return String(p.rol_id) === String(usuario.rol_id)
  })
  delete usuario.clave
  return { ok: true, data: { usuario: usuario, rol: rol, permisos: permisos } }
}

function loginCliente(usuario, clave) {
  if (!usuario) return { ok: false, error: 'Falta el usuario' }
  var clientes = leerTodo('CLIENTES')
  var cliente = clientes.find(function (c) {
    return String(c.usuario) === String(usuario) && String(c.clave) === String(clave)
  })
  if (!cliente) return { ok: false, error: 'Usuario o clave incorrectos' }
  delete cliente.clave
  return { ok: true, data: cliente }
}

// El usuario cambia su propia clave: re-valida la clave actual contra la
// guardada (no basta con estar "logueado" en el frontend, ya que este Web
// App no tiene sesión de servidor) antes de escribir la nueva.
function cambiarClave(email, claveActual, claveNueva) {
  if (!email || !claveActual || !claveNueva) return { ok: false, error: 'Faltan datos' }
  var lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    var usuarios = leerTodo('USUARIOS')
    var usuario = usuarios.find(function (u) {
      return String(u.email).toLowerCase() === String(email).toLowerCase()
    })
    if (!usuario || !esVerdadero(usuario.activo)) {
      return { ok: false, error: 'Usuario no encontrado o inactivo' }
    }
    if (!usuario.clave || String(usuario.clave) !== String(claveActual)) {
      return { ok: false, error: 'Clave actual incorrecta' }
    }
    actualizarFila('USUARIOS', usuario.id, { clave: claveNueva })
    return { ok: true, data: { cambiada: true } }
  } finally {
    lock.releaseLock()
  }
}

// ---- Flujo de compras y ventas (ver ERP-configurable-estructura.md, secciones 4 y 5) ----

function recibirCompra(datos) {
  var lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    var tasaCambio = Number(datos.tasa_cambio) || 1
    var compra = crearFila('COMPRAS', {
      proveedor_id: datos.proveedor_id,
      fecha: datos.fecha,
      estado: datos.estado || 'recibida',
      moneda: datos.moneda || '',
      tasa_cambio: tasaCambio,
      numero_factura: datos.numero_factura || '',
      plazo_dias: datos.plazo_dias || '',
      fecha_vencimiento: datos.fecha_vencimiento || '',
    })

    // El costo de cada línea llega en la moneda de la compra; se convierte a
    // moneda_base con la tasa (congelada en esta compra) para que el costo
    // promedio y la CxP queden en una sola moneda, comparable entre compras.
    var totalCompraBase = 0
    var detalles = (datos.items || []).map(function (item) {
      var detalle = crearFila('COMPRAS_DETALLE', {
        compra_id: compra.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
      })

      var producto = buscarPorId('PRODUCTOS', item.producto_id)
      if (!producto) throw new Error('Producto no encontrado: ' + item.producto_id)

      var stockActual = Number(producto.stock_actual) || 0
      var costoActual = Number(producto.costo_promedio) || 0
      var cantidadComprada = Number(item.cantidad)
      var costoCompraBase = Number(item.costo_unitario) * tasaCambio
      var nuevoStock = stockActual + cantidadComprada
      // Costo promedio ponderado: nuevo_costo = (stock*costo + cant_comprada*costo_compra) / (stock+cant_comprada)
      var nuevoCosto =
        nuevoStock > 0 ? (stockActual * costoActual + cantidadComprada * costoCompraBase) / nuevoStock : costoCompraBase

      actualizarFila('PRODUCTOS', producto.id, { stock_actual: nuevoStock, costo_promedio: nuevoCosto })

      crearFila('MOVIMIENTOS_INVENTARIO', {
        producto_id: producto.id,
        tipo: 'entrada',
        cantidad: cantidadComprada,
        referencia_tipo: 'compra',
        referencia_id: compra.id,
        costo_unitario: costoCompraBase,
        fecha: datos.fecha,
      })

      totalCompraBase += cantidadComprada * costoCompraBase
      return detalle
    })

    var cxp = crearFila('CXP', {
      proveedor_id: datos.proveedor_id,
      compra_id: compra.id,
      saldo: totalCompraBase,
      fecha_vencimiento: datos.fecha_vencimiento || '',
    })

    return { compra: compra, detalles: detalles, cxp: cxp }
  } finally {
    lock.releaseLock()
  }
}

function registrarVenta(datos) {
  var lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    var tasaCambio = Number(datos.tasa_cambio) || 1
    var venta = crearFila('VENTAS', {
      id: generarConsecutivoVenta(),
      cliente_id: datos.cliente_id,
      vendedor_id: datos.vendedor_id,
      fecha: datos.fecha,
      estado: datos.estado || 'cerrada',
      moneda: datos.moneda || '',
      tasa_cambio: tasaCambio,
      tipo_venta: datos.tipo_venta || '',
      numero_factura: datos.numero_factura || '',
      plazo_dias: datos.plazo_dias || '',
      fecha_vencimiento: datos.fecha_vencimiento || '',
    })

    // El precio de cada línea llega en la moneda de la venta; CxC se calcula
    // convertida a moneda_base (con la tasa congelada en esta venta) para que
    // sea comparable. La comisión NO se calcula por línea de producto: depende
    // del tipo_venta de la venta completa (ver TIPOS_VENTA), un % único sobre
    // el total, configurable desde el Sheet sin tocar este código.
    var totalVentaBase = 0
    var detalles = (datos.items || []).map(function (item) {
      var detalle = crearFila('VENTAS_DETALLE', {
        venta_id: venta.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })

      var producto = buscarPorId('PRODUCTOS', item.producto_id)
      if (!producto) throw new Error('Producto no encontrado: ' + item.producto_id)

      var cantidadVendida = Number(item.cantidad)
      var costoVigente = Number(producto.costo_promedio) || 0
      // Se permite inventario negativo (backorder); no se bloquea la venta.
      var nuevoStock = (Number(producto.stock_actual) || 0) - cantidadVendida
      actualizarFila('PRODUCTOS', producto.id, { stock_actual: nuevoStock })

      crearFila('MOVIMIENTOS_INVENTARIO', {
        producto_id: producto.id,
        tipo: 'salida',
        cantidad: cantidadVendida,
        referencia_tipo: 'venta',
        referencia_id: venta.id,
        costo_unitario: costoVigente,
        fecha: datos.fecha,
      })

      var subtotalBase = cantidadVendida * Number(item.precio_unitario) * tasaCambio
      totalVentaBase += subtotalBase

      return detalle
    })

    var tiposVenta = leerTodo('TIPOS_VENTA')
    var tipoVenta = tiposVenta.find(function (t) {
      return String(t.id) === String(datos.tipo_venta)
    })
    var pctComision = tipoVenta ? Number(tipoVenta.comision_pct) || 0 : 0
    var totalComisionBase = totalVentaBase * pctComision

    var comision = crearFila('COMISIONES', {
      venta_id: venta.id,
      vendedor_id: datos.vendedor_id,
      valor_comision: totalComisionBase,
      estado_pago: 'pendiente',
    })

    var cxc = crearFila('CXC', {
      cliente_id: datos.cliente_id,
      venta_id: venta.id,
      saldo: totalVentaBase,
      fecha_vencimiento: datos.fecha_vencimiento || '',
    })

    // Si la venta ya se cobró al momento de registrarla, se salda la CxC de una
    // vez y se deja el PAGOS correspondiente, para no tener que ir aparte a Cartera.
    var pago = null
    if (datos.pagada) {
      actualizarFila('CXC', cxc.id, { saldo: 0 })
      cxc.saldo = 0
      pago = crearFila('PAGOS', {
        referencia_tipo: 'cxc',
        referencia_id: cxc.id,
        monto: totalVentaBase,
        fecha: datos.fecha,
      })
    }

    return { venta: venta, detalles: detalles, comision: comision, cxc: cxc, pago: pago }
  } finally {
    lock.releaseLock()
  }
}

// Consecutivo alfanumérico de venta (RP001, RP002...), independiente del id
// aleatorio que usan las demás pestañas. Se calcula dentro del candado de
// registrarVenta, así que no hay riesgo de dos ventas peleando por el mismo número.
function generarConsecutivoVenta() {
  var ventas = leerTodo('VENTAS')
  var maxNumero = 0
  ventas.forEach(function (v) {
    var coincide = String(v.id).match(/^RP(\d+)$/)
    if (coincide) maxNumero = Math.max(maxNumero, parseInt(coincide[1], 10))
  })
  return 'RP' + String(maxNumero + 1).padStart(3, '0')
}

// Cobro (referencia_tipo=cxc) o pago (referencia_tipo=cxp) real de caja: descuenta
// el saldo pendiente y deja registro en PAGOS. Permite pagos/cobros parciales.
function registrarPago(datos) {
  var lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    var sheetCuenta = datos.referencia_tipo === 'cxc' ? 'CXC' : datos.referencia_tipo === 'cxp' ? 'CXP' : null
    if (!sheetCuenta) return { ok: false, error: 'referencia_tipo debe ser "cxc" o "cxp"' }

    var cuenta = buscarPorId(sheetCuenta, datos.referencia_id)
    if (!cuenta) return { ok: false, error: 'No se encontró la cuenta ' + datos.referencia_id }

    var monto = Number(datos.monto) || 0
    var nuevoSaldo = (Number(cuenta.saldo) || 0) - monto
    actualizarFila(sheetCuenta, cuenta.id, { saldo: nuevoSaldo })

    var pago = crearFila('PAGOS', {
      referencia_tipo: datos.referencia_tipo,
      referencia_id: datos.referencia_id,
      monto: monto,
      fecha: datos.fecha,
    })

    return { ok: true, data: { pago: pago, saldo: nuevoSaldo } }
  } finally {
    lock.releaseLock()
  }
}

// COMISIONES no tiene columna id (para poder crear varias filas por venta en el futuro
// sin depender de un identificador único), así que no se puede ubicar la fila con
// ubicarNumeroFila(). En cambio, venta_id es único por comisión (una por venta), así
// que se busca por ahí directamente.
function marcarComisionPagada(datos) {
  var lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    var hoja = obtenerHoja('COMISIONES')
    var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
    var indiceVenta = encabezados.indexOf('venta_id')
    var indiceEstado = encabezados.indexOf('estado_pago')
    if (indiceVenta === -1 || indiceEstado === -1) {
      return { ok: false, error: 'COMISIONES no tiene las columnas venta_id/estado_pago' }
    }
    var valores = hoja.getRange(2, 1, Math.max(hoja.getLastRow() - 1, 0), encabezados.length).getValues()
    for (var i = 0; i < valores.length; i++) {
      if (String(valores[i][indiceVenta]) === String(datos.venta_id)) {
        hoja.getRange(i + 2, indiceEstado + 1).setValue('pagada')
        var actualizado = {}
        encabezados.forEach(function (h, idx) {
          actualizado[h] = idx === indiceEstado ? 'pagada' : valores[i][idx]
        })
        return { ok: true, data: actualizado }
      }
    }
    return { ok: false, error: 'No se encontró comisión para la venta ' + datos.venta_id }
  } finally {
    lock.releaseLock()
  }
}

// ---- Acceso genérico a las pestañas del Sheet ----

function obtenerHoja(nombre) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre)
  if (!hoja) throw new Error('Pestaña no encontrada: ' + nombre)
  return hoja
}

function leerTodo(nombre) {
  return sheetToObjects(obtenerHoja(nombre))
}

function buscarPorId(nombre, id) {
  return leerTodo(nombre).find(function (fila) {
    return String(fila.id) === String(id)
  })
}

// Sin candado propio: quien llama a crearFila/actualizarFila (el despachador de
// doPost, o recibirCompra/registrarVenta) es responsable de tomar el candado antes
// de invocarla. Así evitamos anidar LockService.getScriptLock() dentro de una
// operación que ya lo tiene (recibirCompra/registrarVenta llaman a estas varias veces).
function crearFila(nombre, datos) {
  var hoja = obtenerHoja(nombre)
  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
  if (encabezados.indexOf('id') !== -1 && !datos.id) {
    datos.id = generarId(nombre)
  }
  var fila = encabezados.map(function (encabezado) {
    return datos[encabezado] !== undefined ? datos[encabezado] : ''
  })
  var numeroFila = hoja.getLastRow() + 1
  var rango = hoja.getRange(numeroFila, 1, 1, encabezados.length)
  rango.setValues([fila])
  corregirFechasConvertidas(rango, fila)
  return datos
}

function actualizarFila(nombre, id, datos) {
  var hoja = obtenerHoja(nombre)
  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
  var numeroFila = ubicarNumeroFila(hoja, encabezados, id)
  if (numeroFila === -1) return null

  var valoresActuales = hoja.getRange(numeroFila, 1, 1, encabezados.length).getValues()[0]
  var actualizado = {}
  var nuevaFila = encabezados.map(function (encabezado, i) {
    var valor = datos[encabezado] !== undefined ? datos[encabezado] : valoresActuales[i]
    actualizado[encabezado] = valor
    return valor
  })
  var rango = hoja.getRange(numeroFila, 1, 1, encabezados.length)
  rango.setValues([nuevaFila])
  corregirFechasConvertidas(rango, nuevaFila)
  return actualizado
}

// Sheets convierte solas cadenas tipo "20-08-2026" en fechas reales al escribirlas,
// lo que rompe el formato DD-MM-AAAA del resto de la app. Forzar '@' (texto) en toda
// la fila de entrada evitaría esto, pero también convierte booleanos (activo) en el
// texto "true"/"false" en vez de dejarlos como booleano real. Por eso corregimos solo
// las celdas que Sheets efectivamente convirtió a fecha, dejando números y booleanos
// intactos.
function corregirFechasConvertidas(rango, filaEscrita) {
  var valores = rango.getValues()[0]
  valores.forEach(function (valor, i) {
    if (Object.prototype.toString.call(valor) === '[object Date]' && typeof filaEscrita[i] === 'string') {
      var celda = rango.getCell(1, i + 1)
      celda.setNumberFormat('@')
      celda.setValue(filaEscrita[i])
    }
  })
}

function borrarFila(nombre, id) {
  var hoja = obtenerHoja(nombre)
  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
  var numeroFila = ubicarNumeroFila(hoja, encabezados, id)
  if (numeroFila === -1) return false
  hoja.deleteRow(numeroFila)
  return true
}

function ubicarNumeroFila(hoja, encabezados, id) {
  var indiceId = encabezados.indexOf('id')
  if (indiceId === -1) throw new Error('La pestaña no tiene columna id')
  var valores = hoja.getRange(2, 1, Math.max(hoja.getLastRow() - 1, 0), encabezados.length).getValues()
  for (var i = 0; i < valores.length; i++) {
    if (String(valores[i][indiceId]) === String(id)) return i + 2
  }
  return -1
}

function generarId(nombre) {
  var prefijo = nombre.toLowerCase().slice(0, 3)
  return prefijo + '-' + Utilities.getUuid().slice(0, 8)
}

// ---- Utilidades ----

function sheetToObjects(sheet) {
  if (!sheet) return []
  var valores = sheet.getDataRange().getValues()
  var encabezados = valores[0]
  var filas = valores.slice(1)
  return filas
    .filter(function (fila) {
      return fila.join('') !== ''
    })
    .map(function (fila) {
      var obj = {}
      encabezados.forEach(function (h, i) {
        obj[h] = formatearSiEsFecha(fila[i])
      })
      return obj
    })
}

// Si alguien escribe una fecha a mano en el Sheet (sin forzar texto), Sheets la
// guarda como fecha real; la devolvemos en DD-MM-AAAA para no romper el formato
// que usa el resto de la app.
function formatearSiEsFecha(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    var dd = ('0' + valor.getDate()).slice(-2)
    var mm = ('0' + (valor.getMonth() + 1)).slice(-2)
    return dd + '-' + mm + '-' + valor.getFullYear()
  }
  return valor
}

function esVerdadero(valor) {
  return valor === true || valor === 'TRUE' || valor === 'true' || valor === 'VERDADERO' || valor === 1
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON
  )
}
