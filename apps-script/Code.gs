// Este script se pega en Extensiones > Apps Script del Google Sheet del cliente
// (una copia del Sheet plantilla en docs/ERP_Sheet_Plantilla.xlsx) y se publica
// como Web App (Ejecutar como: yo / Acceso: cualquiera). Sirve como API genérica:
// lee y escribe cualquier pestaña del modelo de datos sin necesitar un endpoint
// por tabla. Ver ERP-configurable-estructura.md para el modelo de datos completo.
//
// GET  ?action=list&sheet=PRODUCTOS
// GET  ?action=get&sheet=PRODUCTOS&id=p-1
// POST { action: "create"|"update"|"delete", sheet, id, data }
// POST { action: "login", data: { email } }
// POST { action: "loginCliente", data: { usuario, clave } }

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

    if (accion === 'create') {
      return responder({ ok: true, data: crearFila(sheetName, body.data || {}) })
    }
    if (accion === 'update') {
      var actualizado = actualizarFila(sheetName, body.id, body.data || {})
      if (!actualizado) return responder({ ok: false, error: 'No encontrado' })
      return responder({ ok: true, data: actualizado })
    }
    if (accion === 'delete') {
      var borrado = borrarFila(sheetName, body.id)
      return responder({ ok: true, data: { borrado: borrado } })
    }
    if (accion === 'login') {
      return responder(login(body.email))
    }
    if (accion === 'loginCliente') {
      return responder(loginCliente(body.usuario, body.clave))
    }
    return responder({ ok: false, error: 'Acción POST no reconocida: ' + accion })
  } catch (err) {
    return responder({ ok: false, error: String(err) })
  }
}

function login(email) {
  if (!email) return { ok: false, error: 'Falta el correo' }
  var usuarios = leerTodo('USUARIOS')
  var usuario = usuarios.find(function (u) {
    return String(u.email).toLowerCase() === String(email).toLowerCase()
  })
  if (!usuario || !esVerdadero(usuario.activo)) {
    return { ok: false, error: 'Usuario no encontrado o inactivo' }
  }
  var roles = leerTodo('ROLES')
  var rol = roles.find(function (r) {
    return String(r.id) === String(usuario.rol_id)
  })
  var permisos = leerTodo('PERMISOS_ROL').filter(function (p) {
    return String(p.rol_id) === String(usuario.rol_id)
  })
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

function crearFila(nombre, datos) {
  var hoja = obtenerHoja(nombre)
  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
  if (encabezados.indexOf('id') !== -1 && !datos.id) {
    datos.id = generarId(nombre)
  }
  var fila = encabezados.map(function (encabezado) {
    return datos[encabezado] !== undefined ? datos[encabezado] : ''
  })
  hoja.appendRow(fila)
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
  hoja.getRange(numeroFila, 1, 1, encabezados.length).setValues([nuevaFila])
  return actualizado
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
        obj[h] = fila[i]
      })
      return obj
    })
}

function esVerdadero(valor) {
  return valor === true || valor === 'TRUE' || valor === 'VERDADERO' || valor === 1
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON
  )
}
