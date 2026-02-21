// ==================== ESTADO ====================
let PRECIOS_RAPIDOS = JSON.parse(localStorage.getItem('cantina_precios') || '[500,1000,1500,2000,3000,4000,5000]');
let historial = JSON.parse(localStorage.getItem('cantina_historial') || '[]');
let pedido = {};
let totalActual = 0;
let modoEdicion = false;

// ==================== TABS ====================
function irA(pagina) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
  document.querySelectorAll('.pagina').forEach(p => p.classList.remove('activa'));
  const idx = ['cobro','historial','caja'].indexOf(pagina);
  document.querySelectorAll('.tab')[idx].classList.add('activo');
  document.getElementById('pag-' + pagina).classList.add('activa');
  if (pagina === 'historial') renderHistorial();
  if (pagina === 'caja') renderCaja();
}

// ==================== PRECIOS ====================
function toggleEditarPrecios() {
  modoEdicion = !modoEdicion;
  const btn = document.getElementById('btn-editar-precios');
  btn.innerHTML = modoEdicion
    ? '<i class="fa-solid fa-check"></i> Listo'
    : '<i class="fa-solid fa-pen-to-square"></i> Editar';
  btn.classList.toggle('activo', modoEdicion);
  renderPrecios();
}

function renderPrecios() {
  const grid = document.getElementById('precios-grid');
  const sorted = [...PRECIOS_RAPIDOS].sort((a,b) => a - b);
  if (modoEdicion) {
    grid.innerHTML = sorted.map(p => `
      <button class="btn-precio btn-precio-editar" onclick="eliminarPrecio(${p})">
        <i class="fa-solid fa-trash"></i>
        <span class="monto">₲ ${fmt(p)}</span>
      </button>
    `).join('') + `<button class="btn-add-precio" onclick="abrirModalPrecio()"><i class="fa-solid fa-plus"></i><br><small>Precio</small></button>`;
  } else {
    grid.innerHTML = sorted.map(p => `
      <button class="btn-precio" onclick="agregarMonto(${p})">
        <span class="monto">₲ ${fmt(p)}</span>
      </button>
    `).join('') + `<button class="btn-add-precio" onclick="abrirModalPrecio()"><i class="fa-solid fa-plus"></i><br><small>Precio</small></button>`;
  }
}

function eliminarPrecio(precio) {
  PRECIOS_RAPIDOS = PRECIOS_RAPIDOS.filter(p => p !== precio);
  localStorage.setItem('cantina_precios', JSON.stringify(PRECIOS_RAPIDOS));
  if (PRECIOS_RAPIDOS.length === 0) { modoEdicion = false; document.getElementById('btn-editar-precios').classList.remove('activo'); }
  renderPrecios();
  mostrarToast('<i class="fa-solid fa-trash"></i> ₲ ' + fmt(precio) + ' eliminado');
}

function abrirModalPrecio() {
  document.getElementById('modal-precio-overlay').classList.add('visible');
  document.getElementById('mp-precio').value = '';
  setTimeout(() => document.getElementById('mp-precio').focus(), 150);
}

function cerrarModalPrecio(e) {
  if (e && e.target !== document.getElementById('modal-precio-overlay')) return;
  document.getElementById('modal-precio-overlay').classList.remove('visible');
}

function guardarPrecioRapido() {
  const val = parseInt(document.getElementById('mp-precio').value);
  if (!val || val <= 0) { mostrarToast('<i class="fa-solid fa-triangle-exclamation"></i> Ingresá un precio válido'); return; }
  if (PRECIOS_RAPIDOS.includes(val)) { mostrarToast('<i class="fa-solid fa-triangle-exclamation"></i> Ese precio ya existe'); return; }
  PRECIOS_RAPIDOS.push(val);
  localStorage.setItem('cantina_precios', JSON.stringify(PRECIOS_RAPIDOS));
  renderPrecios();
  cerrarModalPrecio();
  mostrarToast('<i class="fa-solid fa-circle-check"></i> ₲ ' + fmt(val) + ' agregado');
}

// ==================== PEDIDO ====================
function agregarMonto(monto) {
  const key = 'monto_' + monto;
  if (!pedido[key]) pedido[key] = { id: key, nombre: '₲ ' + fmt(monto), precio: monto, qty: 0 };
  pedido[key].qty++;
  renderPedido();
}

function cambiarQty(id, delta) {
  if (!pedido[id]) return;
  pedido[id].qty += delta;
  if (pedido[id].qty <= 0) delete pedido[id];
  renderPedido();
}

function renderPedido() {
  const lista = document.getElementById('lista-pedido');
  const items = Object.values(pedido);
  if (items.length === 0) {
    lista.innerHTML = '<p class="vacio-msg"><i class="fa-solid fa-basket-shopping"></i> Tocá un precio para agregar al pedido</p>';
    totalActual = 0;
  } else {
    lista.innerHTML = items.map(p => `
      <div class="item-pedido">
        <span class="item-nom">${p.nombre}</span>
        <div class="controles">
          <button class="btn-qty menos" onclick="cambiarQty('${p.id}', -1)"><i class="fa-solid fa-minus"></i></button>
          <span class="item-qty">${p.qty}</span>
          <button class="btn-qty mas" onclick="cambiarQty('${p.id}', 1)"><i class="fa-solid fa-plus"></i></button>
        </div>
        <span class="item-sub">₲ ${fmt(p.precio * p.qty)}</span>
      </div>
    `).join('');
    totalActual = items.reduce((s, p) => s + p.precio * p.qty, 0);
  }
  document.getElementById('total-display').textContent = '₲ ' + fmt(totalActual);
  calcularVuelto();
}

// ==================== PAGO ====================
function sumarPago(monto) {
  const input = document.getElementById('pago-cliente');
  input.value = (parseInt(input.value) || 0) + monto;
  calcularVuelto();
}

function pagoExacto() {
  document.getElementById('pago-cliente').value = totalActual;
  calcularVuelto();
}

function limpiarPago() {
  document.getElementById('pago-cliente').value = '';
  document.getElementById('vuelto-display').innerHTML = '';
}

function calcularVuelto() {
  const pago = parseFloat(document.getElementById('pago-cliente').value) || 0;
  const div = document.getElementById('vuelto-display');
  if (pago === 0 || totalActual === 0) { div.innerHTML = ''; return; }
  const vuelto = pago - totalActual;
  if (vuelto >= 0) {
    div.innerHTML = `<div class="vuelto-pill vuelto-ok"><i class="fa-solid fa-circle-check"></i> Vuelto: ₲ ${fmt(vuelto)}</div>`;
  } else {
    div.innerHTML = `<div class="vuelto-pill vuelto-falta"><i class="fa-solid fa-triangle-exclamation"></i> Faltan: ₲ ${fmt(Math.abs(vuelto))}</div>`;
  }
}

function cobrar() {
  if (totalActual === 0) { mostrarToast('<i class="fa-solid fa-triangle-exclamation"></i> El pedido está vacío'); return; }
  const pago = parseFloat(document.getElementById('pago-cliente').value) || 0;
  if (pago > 0 && pago < totalActual) { mostrarToast('<i class="fa-solid fa-triangle-exclamation"></i> El pago no alcanza'); return; }

  const ahora = new Date();
  historial.unshift({
    id: Date.now(),
    hora: ahora.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' }),
    fecha: ahora.toLocaleDateString('es-PY', { weekday: 'short', day: 'numeric', month: 'short' }),
    fechaKey: ahora.toISOString().split('T')[0],
    total: totalActual, pago,
    vuelto: pago > 0 ? pago - totalActual : 0,
    items: Object.values(pedido).map(p => ({ nombre: p.nombre, qty: p.qty, precio: p.precio }))
  });
  localStorage.setItem('cantina_historial', JSON.stringify(historial));
  mostrarToast('<i class="fa-solid fa-circle-check"></i> ¡Cobrado! ₲ ' + fmt(totalActual));
  cancelarPedido();
}

function cancelarPedido() {
  pedido = {};
  limpiarPago();
  renderPedido();
}

// ==================== HISTORIAL ====================
function renderHistorial() {
  const cont = document.getElementById('historial-contenido');
  if (historial.length === 0) {
    cont.innerHTML = `<div class="sin-datos"><i class="fa-solid fa-clock-rotate-left icon"></i>No hay ventas registradas aún.</div>`;
    return;
  }
  const grupos = {};
  historial.forEach(v => {
    if (!grupos[v.fechaKey]) grupos[v.fechaKey] = { label: v.fecha, ventas: [] };
    grupos[v.fechaKey].ventas.push(v);
  });
  cont.innerHTML = Object.entries(grupos).map(([key, g]) => {
    const sub = g.ventas.reduce((s, v) => s + v.total, 0);
    return `
      <div class="dia-header" style="margin-top:16px">
        <div class="fecha-chip"><i class="fa-regular fa-calendar"></i> ${g.label}</div>
        <span class="dia-subtotal">₲ ${fmt(sub)} · ${g.ventas.length} cobros</span>
      </div>
      ${g.ventas.map(v => `
        <div class="venta-card">
          <div>
            <div class="venta-monto">₲ ${fmt(v.total)}</div>
            <div class="venta-detalle">${v.items.map(i => `${i.nombre}×${i.qty}`).join(' · ')}</div>
          </div>
          <div>
            <div class="venta-hora">${v.hora}</div>
            ${v.pago > 0 ? `<div class="venta-vuelto">vuelto ₲${fmt(v.vuelto)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    `;
  }).join('');
}

// ==================== CAJA ====================
function renderCaja() {
  const cont = document.getElementById('caja-contenido');
  if (historial.length === 0) {
    cont.innerHTML = `<div class="sin-datos"><i class="fa-solid fa-cash-register icon"></i>Sin ventas registradas.</div>
      <button class="btn-cierre" style="opacity:0.5" onclick="document.getElementById('confirm-overlay').classList.add('visible')"><i class="fa-solid fa-lock"></i> Cerrar caja</button>`;
    return;
  }
  const hoy = new Date().toISOString().split('T')[0];
  const ventasHoy = historial.filter(v => v.fechaKey === hoy);
  const totalDia = ventasHoy.reduce((s, v) => s + v.total, 0);
  const totalGral = historial.reduce((s, v) => s + v.total, 0);
  const cant = ventasHoy.length;
  const prom = cant > 0 ? Math.round(totalDia / cant) : 0;

  const conteo = {};
  ventasHoy.forEach(v => v.items.forEach(i => {
    if (!conteo[i.nombre]) conteo[i.nombre] = { nombre: i.nombre, qty: 0, monto: 0 };
    conteo[i.nombre].qty += i.qty;
    conteo[i.nombre].monto += i.qty * i.precio;
  }));
  const top = Object.values(conteo).sort((a, b) => b.qty - a.qty).slice(0, 5);

  cont.innerHTML = `
    <div style="margin-top:14px"></div>
    <div class="resumen-card">
      <div class="card-titulo"><i class="fa-regular fa-calendar-days"></i> Hoy</div>
      <div class="stat-hero">
        <div class="num">₲ ${fmt(totalDia)}</div>
        <div class="label">Total recaudado hoy</div>
      </div>
      <div class="mini-grid">
        <div class="mini-stat"><div class="num">${cant}</div><div class="label">Cobros</div></div>
        <div class="mini-stat"><div class="num">₲ ${fmt(prom)}</div><div class="label">Promedio</div></div>
      </div>
    </div>
    ${top.length > 0 ? `
    <div class="resumen-card">
      <div class="card-titulo"><i class="fa-solid fa-trophy"></i> Más cobrados hoy</div>
      ${top.map((p, i) => `
        <div class="top-item">
          <div class="top-rank ${i===0?'gold':''}">${i===0?'<i class="fa-solid fa-medal"></i>':`#${i+1}`}</div>
          <span class="top-nom">${p.nombre}</span>
          <span class="top-cant">${p.qty} veces</span>
          <span class="top-monto">₲ ${fmt(p.monto)}</span>
        </div>
      `).join('')}
    </div>` : ''}
    <div class="resumen-card">
      <div class="card-titulo"><i class="fa-solid fa-chart-bar"></i> Acumulado total</div>
      <div class="stat-hero">
        <div class="num">₲ ${fmt(totalGral)}</div>
        <div class="label">${historial.length} cobros registrados</div>
      </div>
    </div>
    <button class="btn-cierre" onclick="document.getElementById('confirm-overlay').classList.add('visible')"><i class="fa-solid fa-lock"></i> Cerrar caja del día</button>
    <p style="text-align:center;font-size:0.72rem;color:var(--gris);margin-top:10px">Esto limpiará el historial para empezar un día nuevo</p>
  `;
}

function ejecutarCierre() {
  historial = [];
  localStorage.setItem('cantina_historial', JSON.stringify(historial));
  document.getElementById('confirm-overlay').classList.remove('visible');
  renderCaja();
  mostrarToast('<i class="fa-solid fa-lock"></i> Caja cerrada. ¡Nuevo día!');
}

// ==================== UTILS ====================
function fmt(n) { return Math.round(n).toLocaleString('es-PY'); }

function mostrarToast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 2200);
}

// ==================== INIT ====================
renderPrecios();
renderPedido();
