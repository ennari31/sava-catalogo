/**
 * CATÁLOGO SAVA — API sobre Google Sheets
 * ----------------------------------------
 * Hoja "Productos": una fila por variante (color + talle).
 *   producto_id | nombre | categoria | color | talle | precio | precio_promo | stock | imagenes | descripcion | activo
 * Hoja "Pedidos": se crea sola con el primer pedido.
 *
 * GET  → devuelve los productos activos en JSON (lo lee el catálogo).
 * POST → recibe un pedido, valida stock, lo descuenta y lo registra en "Pedidos".
 *
 * Instalación: Extensiones → Apps Script → pegar este código → Implementar →
 * Nueva implementación → Aplicación web → Ejecutar como: Yo · Acceso: Cualquier persona.
 * Copiar la URL /exec y pegarla en API_URL dentro del catálogo.
 */

const HOJA_PRODUCTOS = 'Productos';
const HOJA_PEDIDOS = 'Pedidos';
const MINIMO_PARES = 6; // compra mínima mayorista

function doGet() {
  const { headers, rows } = leerProductos_();
  const productos = rows
    .map(r => objeto_(headers, r))
    .filter(p => String(p.activo).trim().toUpperCase() !== 'NO');
  return json_({ ok: true, actualizado: new Date().toISOString(), productos });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // evita que dos pedidos simultáneos descuenten el mismo stock
  try {
    const pedido = JSON.parse(e.postData.contents);
    const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_PRODUCTOS);
    const { headers, rows } = leerProductos_();
    const col = n => headers.indexOf(n);
    const clave = (id, color, talle) => [id, color, talle].map(v => String(v).trim().toLowerCase()).join('|');

    const indice = {};
    rows.forEach((r, i) => { indice[clave(r[col('producto_id')], r[col('color')], r[col('talle')])] = i; });

    // 1) Validar todo antes de tocar el stock
    const faltantes = [];
    const lineas = pedido.items.map(it => {
      const i = indice[clave(it.producto_id, it.color, it.talle)];
      if (i === undefined) { faltantes.push({ ...it, disponible: 0 }); return null; }
      const r = rows[i];
      const stock = Number(r[col('stock')]) || 0;
      if (stock < it.cant) faltantes.push({ ...it, disponible: stock });
      const promo = Number(r[col('precio_promo')]) || 0;
      const precio = promo > 0 ? promo : Number(r[col('precio')]) || 0;
      return { i, nombre: r[col('nombre')], color: r[col('color')], talle: r[col('talle')], cant: it.cant, precio, stock };
    });
    if (faltantes.length) return json_({ ok: false, error: 'sin_stock', faltantes });
    const pares = pedido.items.reduce((s, it) => s + Number(it.cant || 0), 0);
    if (pares < MINIMO_PARES) return json_({ ok: false, error: `El mínimo de compra es de ${MINIMO_PARES} pares.` });

    // 2) Descontar stock (precio siempre tomado de la hoja, no del navegador)
    const colStock = col('stock') + 1;
    lineas.forEach(l => hoja.getRange(l.i + 2, colStock).setValue(l.stock - l.cant));

    // 3) Registrar pedido
    let ped = SpreadsheetApp.getActive().getSheetByName(HOJA_PEDIDOS);
    if (!ped) {
      ped = SpreadsheetApp.getActive().insertSheet(HOJA_PEDIDOS);
      ped.appendRow(['n_pedido', 'fecha', 'cliente', 'telefono', 'entrega', 'direccion', 'pago', 'notas', 'detalle', 'unidades', 'total', 'estado']);
      ped.setFrozenRows(1);
    }
    const nro = 'P' + String(ped.getLastRow()).padStart(4, '0');
    const total = lineas.reduce((s, l) => s + l.precio * l.cant, 0);
    const detalle = lineas.map(l => `${l.cant} x ${l.nombre} (${l.color} / T${l.talle})`).join('\n');
    const c = pedido.cliente || {};
    ped.appendRow([nro, new Date(), c.nombre || '', c.telefono || '', c.entrega || '', c.direccion || '', c.pago || '', c.notas || '',
      detalle, lineas.reduce((s, l) => s + l.cant, 0), total, 'Nuevo']);

    return json_({ ok: true, pedido: nro, total, lineas: lineas.map(({ i, stock, ...l }) => l) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function leerProductos_() {
  const values = SpreadsheetApp.getActive().getSheetByName(HOJA_PRODUCTOS).getDataRange().getValues();
  const headers = values.shift().map(h => String(h).trim().toLowerCase());
  return { headers, rows: values.filter(r => r.join('').trim() !== '') };
}

function objeto_(headers, r) {
  const o = {};
  headers.forEach((h, i) => { o[h] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
  return o;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
