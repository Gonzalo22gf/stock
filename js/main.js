const API_URL = "https://stockalert-api.onrender.com";

const seccionAuth = document.querySelector("#seccionAuth");
const seccionUsuario = document.querySelector("#seccionUsuario");
const seccionesApp = document.querySelectorAll(".seccion-app");

const formLogin = document.querySelector("#formLogin");
const formRegistro = document.querySelector("#formRegistro");
const btnCerrarSesion = document.querySelector("#btnCerrarSesion");

const nombreUsuario = document.querySelector("#nombreUsuario");
const nombreSucursal = document.querySelector("#nombreSucursal");
const panelAdminGlobal = document.querySelector("#panelAdminGlobal");
const resumenSucursales = document.querySelector("#resumenSucursales");

const filtroCategoria = document.querySelector("#filtroCategoria");
const contenedorProductos = document.querySelector("#contenedorProductos");
const contenedorMovimientos = document.querySelector("#contenedorMovimientos");
const buscarMovimiento = document.querySelector("#buscarMovimiento");
const filtroAccion = document.querySelector("#filtroAccion");

const totalCrear = document.querySelector("#totalCrear");
const totalEditar = document.querySelector("#totalEditar");
const totalEliminar = document.querySelector("#totalEliminar");

const btnExportarMovimientos = document.querySelector("#btnExportarMovimientos");
const btnAnteriorMovimientos = document.querySelector("#btnAnteriorMovimientos");
const btnSiguienteMovimientos = document.querySelector("#btnSiguienteMovimientos");
const paginaActualMovimientos = document.querySelector("#paginaActualMovimientos");

const formProducto = document.querySelector("#formProducto");
const buscador = document.querySelector("#buscador");
const filtroEstado = document.querySelector("#filtroEstado");
const ordenar = document.querySelector("#ordenar");
const btnModoOscuro = document.querySelector("#btnModoOscuro");
const btnLimpiarFiltros = document.querySelector("#btnLimpiarFiltros");

const totalProductos = document.querySelector("#totalProductos");
const productosPorVencer = document.querySelector("#productosPorVencer");
const productosVencidos = document.querySelector("#productosVencidos");
const productosStockBajo = document.querySelector("#productosStockBajo");
const productosAgotados = document.querySelector("#productosAgotados");
const valorInventario = document.querySelector("#valorInventario");

const codigoBarrasInput = document.querySelector("#codigoBarras");
const loteInput = document.querySelector("#lote");
const btnEscanear = document.querySelector("#btnEscanear");
const lectorCodigo = document.querySelector("#lectorCodigo");

const inputImportar = document.querySelector("#inputImportar");
const btnImportarExcel = document.querySelector("#btnImportarExcel");
const btnExportarExcel = document.querySelector("#btnExportarExcel");

const graficoEstados = document.querySelector("#graficoEstados");
const graficoCategorias = document.querySelector("#graficoCategorias");
const graficoStockCategorias = document.querySelector("#graficoStockCategorias");
const graficoValorInventario = document.querySelector("#graficoValorInventario");

let chartEstados = null;
let chartCategorias = null;
let chartStockCategorias = null;
let chartValorInventario = null;

let productos = [];
let movimientos = [];
let movimientosFiltradosActuales = [];
let productosFiltradosActuales = [];
let sucursales = [];
let sucursalSeleccionada = "";

// Paginación movimientos
let paginaMovimientos = 1;
const movimientosPorPagina = 12;

// Filtro fechas movimientos
let filtroFechaDias = 0; // 0=hoy, 7=7días, 30=30días, -1=todos
let filtroFechaDesdeVal = null;
let filtroFechaHastaVal = null;

// Paginación productos
let paginaProductos = 1;
const productosPorPagina = 20;

// Vista productos
let vistaActual = "cards"; // "cards" o "lista"

// KPI anteriores para tendencia
let kpiPrevio = { criticos: null, valorRiesgo: null, porVencer: null };

let token = localStorage.getItem("tokenStockAlert") || "";
let usuarioActivo = JSON.parse(localStorage.getItem("usuarioStockAlert")) || null;

let escanerActivo = false;
let html5QrCode = null;

document.addEventListener("DOMContentLoaded", iniciarApp);

btnImportarExcel?.addEventListener("click", importarExcel);
btnExportarExcel?.addEventListener("click", exportarExcel);

buscarMovimiento?.addEventListener("input", () => {
  paginaMovimientos = 1;
  aplicarFiltroMovimientos();
});

filtroAccion?.addEventListener("change", () => {
  paginaMovimientos = 1;
  aplicarFiltroMovimientos();
});

document.addEventListener("change", (e) => {
  if (e.target.id === "filtroSucursalMov" || e.target.id === "filtroUsuarioMov") {
    paginaMovimientos = 1;
    aplicarFiltroMovimientos();
  }
});

document.addEventListener("click", (e) => {
  if (e.target.id === "btnLimpiarFiltrosMov") {
    // Limpiar todos los filtros y volver a hoy
    if (buscarMovimiento)   buscarMovimiento.value = "";
    const fa = document.querySelector("#filtroAccion");
    const fs = document.querySelector("#filtroSucursalMov");
    const fu = document.querySelector("#filtroUsuarioMov");
    const fd = document.querySelector("#filtroFechaDesde");
    const fh = document.querySelector("#filtroFechaHasta");
    if (fa) fa.value = "todos";
    if (fs) fs.value = "todas";
    if (fu) fu.value = "todos";
    if (fd) fd.value = "";
    if (fh) fh.value = "";

    // Volver a chip "Hoy"
    filtroFechaDias = 0;
    filtroFechaDesdeVal = null;
    filtroFechaHastaVal = null;
    document.querySelectorAll(".fecha-chip").forEach(c => c.classList.remove("activa"));
    const chipHoy = document.querySelector('.fecha-chip[data-dias="0"]');
    if (chipHoy) chipHoy.classList.add("activa");

    paginaMovimientos = 1;
    aplicarFiltroMovimientos();
  }
});

btnExportarMovimientos?.addEventListener("click", exportarMovimientos);
btnAnteriorMovimientos?.addEventListener("click", paginaAnteriorMovimientos);
btnSiguienteMovimientos?.addEventListener("click", paginaSiguienteMovimientos);

async function iniciarApp() {
  btnEscanear?.addEventListener("click", iniciarEscaner);

  // Botón limpiar formulario (antes "Agregar lote")
  const btnLimpiarForm = document.querySelector("#btnAgregarLote");
  if (btnLimpiarForm) {
    btnLimpiarForm.addEventListener("click", () => {
      formProducto.reset();
      // Restaurar solo una fila de lote
      const contenedorLotes = document.querySelector("#contenedorLotes");
      if (contenedorLotes) {
        contenedorLotes.innerHTML = `
          <div class="fila-lote">
            <input type="text" class="lote-numero" placeholder="Lote" autocomplete="off" spellcheck="false">
            <input type="number" class="lote-stock" placeholder="Stock" min="0" required autocomplete="off">
            <input type="date" class="lote-vencimiento" required autocomplete="off">
          </div>
        `;
      }
      Swal.fire({ icon: "success", title: "Formulario limpiado", timer: 900, showConfirmButton: false });
    });
  }
  aplicarModoGuardado();
  actualizarFechaTopbar();
  iniciarBusquedaGlobal();
  iniciarFiltroFechas();
  iniciarToggleVista();
  iniciarSidebarCollapse();
  iniciarFAB();

  if (token && usuarioActivo) {
    mostrarApp();

    if (usuarioActivo.rol === "admin") {
      await cargarSucursalesAPI();
      await cargarResumenSucursales();
    }

    await cargarProductosAPI();
    await cargarMovimientosAPI();
  } else {
    mostrarAuth();
  }
}

function actualizarFechaTopbar() {
  const topbarFecha = document.querySelector("#topbarFecha");
  if (topbarFecha) {
    topbarFecha.textContent = new Date().toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  }
}

function actualizarTopbarYSidebar() {
  if (!usuarioActivo) return;

  const topbarNombreUser = document.querySelector("#topbarNombreUser");
  const topbarRolUser = document.querySelector("#topbarRolUser");
  const topbarAvatar = document.querySelector("#topbarAvatar");
  const topbarNombreSucursal = document.querySelector("#topbarNombreSucursal");

  if (topbarNombreUser) topbarNombreUser.textContent = usuarioActivo.nombre;
  if (topbarRolUser) topbarRolUser.textContent = usuarioActivo.rol === "admin" ? "Administrador" : "Usuario";
  if (topbarAvatar) topbarAvatar.textContent = usuarioActivo.nombre?.[0]?.toUpperCase() || "U";
  if (topbarNombreSucursal) {
    topbarNombreSucursal.textContent = usuarioActivo.rol === "admin"
      ? "Todas las sucursales"
      : (usuarioActivo.sucursal?.nombre || "Mi sucursal");
  }

  const sidebarNombreUsuario = document.querySelector("#sidebarNombreUsuario");
  const sidebarRolUsuario = document.querySelector("#sidebarRolUsuario");
  if (sidebarNombreUsuario) sidebarNombreUsuario.textContent = usuarioActivo.nombre;
  if (sidebarRolUsuario) sidebarRolUsuario.textContent = usuarioActivo.rol === "admin" ? "Administrador" : "Usuario";
}

function mostrarAuth() {
  seccionAuth.classList.remove("oculto");
  seccionUsuario.classList.add("oculto");
  seccionesApp.forEach((s) => s.classList.add("oculto"));
  panelAdminGlobal?.classList.add("oculto");

  const topbar  = document.querySelector("#topbar");
  const sidebar = document.querySelector("#sidebar");
  if (topbar)  topbar.classList.add("oculto");
  if (sidebar) {
    sidebar.classList.add("oculto");
    sidebar.classList.remove("open");
    document.querySelector("#sidebarOverlay")?.classList.remove("show");
    document.body.style.overflow = "";
  }
  ocultarFAB();

  const sidebarUser = document.querySelector("#sidebarUser");
  const badge       = document.querySelector("#navBadgeAlertas");
  if (sidebarUser) sidebarUser.style.display = "none";
  if (badge) { badge.textContent = ""; badge.classList.remove("visible"); }

  formLogin?.reset();
  formRegistro?.reset();

  const selectorAdmin = document.querySelector("#selectorSucursalAdmin");
  if (selectorAdmin) selectorAdmin.remove();

  if (contenedorMovimientos) contenedorMovimientos.innerHTML = "";
  if (buscarMovimiento) buscarMovimiento.value = "";
  if (filtroAccion) filtroAccion.value = "todos";

  actualizarDashboardMovimientos([]);
}

function mostrarApp() {
  seccionAuth.classList.add("oculto");
  seccionUsuario.classList.remove("oculto");
  seccionesApp.forEach((s) => s.classList.remove("oculto"));

  const topbar  = document.querySelector("#topbar");
  const sidebar = document.querySelector("#sidebar");
  if (topbar)  topbar.classList.remove("oculto");
  if (sidebar) sidebar.classList.remove("oculto");
  mostrarFAB();

  const sidebarUser   = document.querySelector("#sidebarUser");
  const sidebarAvatar = document.querySelector("#sidebarAvatar");
  if (sidebarUser)   sidebarUser.style.display = "";
  if (sidebarAvatar) sidebarAvatar.textContent = usuarioActivo.nombre?.[0]?.toUpperCase() || "U";

  nombreUsuario.textContent = usuarioActivo.nombre;

  if (usuarioActivo.rol === "admin") {
    nombreSucursal.textContent = "Rol: Administrador";
    panelAdminGlobal?.classList.remove("oculto");
  } else {
    nombreSucursal.textContent = `Sucursal: ${usuarioActivo.sucursal?.nombre || "Sin sucursal"}`;
    panelAdminGlobal?.classList.add("oculto");
  }

  actualizarTopbarYSidebar();
  iniciarTabsAdmin();
}

function iniciarTabsAdmin() {
  const tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("activa"));
      tab.classList.add("activa");
      const idTab = tab.dataset.tab;
      document.querySelectorAll(".admin-tab-content").forEach((c) => c.classList.remove("activa"));
      const contenido = document.querySelector(`#tab-${idTab}`);
      if (contenido) contenido.classList.add("activa");

      // Cargar contenido según tab
      if (idTab === "sucursales")  cargarSucursalesAdmin();
      if (idTab === "comparativo") cargarComparativoSucursales();
      if (idTab === "usuarios")    cargarUsuariosAdmin();
    });
  });
}

function crearSelectorSucursales() {
  if (usuarioActivo?.rol !== "admin") return;

  const selectorExistente = document.querySelector("#selectorSucursalAdmin");
  if (selectorExistente) selectorExistente.remove();

  const contenedorSelector = document.createElement("div");
  contenedorSelector.id = "selectorSucursalAdmin";
  contenedorSelector.style.marginTop = "12px";

  contenedorSelector.innerHTML = `
    <label for="filtroSucursalAdmin" style="display:block; font-weight:bold; margin-bottom:6px;">
      🏪 Ver sucursal
    </label>
    <select id="filtroSucursalAdmin" style="
      padding: 10px;
      border-radius: 10px;
      border: 1px solid #ccc;
      width: 100%;
      max-width: 280px;
      font-weight: bold;
    ">
      <option value="">Todas las sucursales</option>
      ${sucursales.map((s) => `<option value="${s._id}">${s.nombre}</option>`).join("")}
    </select>
  `;

  nombreSucursal.insertAdjacentElement("afterend", contenedorSelector);

  const filtroSucursalAdmin = document.querySelector("#filtroSucursalAdmin");
  filtroSucursalAdmin.value = sucursalSeleccionada;

  filtroSucursalAdmin.addEventListener("change", async (e) => {
    sucursalSeleccionada = e.target.value;
    paginaMovimientos = 1;
    paginaProductos = 1;
    await cargarProductosAPI();
    await cargarResumenSucursales();
    await cargarMovimientosAPI();
  });
}

async function cargarSucursalesAPI() {
  try {
    const respuesta = await fetch(`${API_URL}/api/sucursales`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al cargar sucursales");
    sucursales = data;
    crearSelectorSucursales();
  } catch (error) {
    console.error("ERROR SUCURSALES:", error);
    Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar las sucursales." });
  }
}

async function cargarResumenSucursales() {
  if (usuarioActivo?.rol !== "admin") return;

  try {
    const respuesta = await fetch(`${API_URL}/api/sucursales/resumen`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al cargar resumen");

    resumenSucursales.innerHTML = "";

    if (data.length === 0) {
      resumenSucursales.innerHTML = `<p class="mensaje-vacio">No hay sucursales para mostrar.</p>`;
      return;
    }

    let resumenFinal;

    if (sucursalSeleccionada) {
      resumenFinal = data.find((item) => item.sucursal._id === sucursalSeleccionada);
    } else {
      resumenFinal = {
        sucursal: { nombre: "Todas las sucursales" },
        totalProductos: data.reduce((t, i) => t + i.totalProductos, 0),
        porVencer: data.reduce((t, i) => t + i.porVencer, 0),
        vencidos: data.reduce((t, i) => t + i.vencidos, 0),
        stockCritico: data.reduce((t, i) => t + i.stockCritico, 0),
        agotados: data.reduce((t, i) => t + i.agotados, 0),
        valorInventario: data.reduce((t, i) => t + i.valorInventario, 0)
      };
    }

    if (!resumenFinal) {
      resumenSucursales.innerHTML = `<p class="mensaje-vacio">No hay datos para esta sucursal.</p>`;
      return;
    }

    resumenSucursales.innerHTML = `
      <article class="card-resumen-sucursal">
        <h3>🏪 ${resumenFinal.sucursal.nombre}</h3>
        <p><strong>📦 Productos:</strong> ${resumenFinal.totalProductos}</p>
        <p><strong>⚠️ Por vencer:</strong> ${resumenFinal.porVencer}</p>
        <p><strong>❌ Vencidos:</strong> ${resumenFinal.vencidos}</p>
        <p><strong>📉 Stock crítico:</strong> ${resumenFinal.stockCritico}</p>
        <p><strong>🚫 Agotados:</strong> ${resumenFinal.agotados}</p>
        <p><strong>💰 Inventario:</strong> ${resumenFinal.valorInventario.toLocaleString("es-AR", {
          style: "currency", currency: "ARS", maximumFractionDigits: 0
        })}</p>
      </article>
    `;
  } catch (error) {
    console.error("ERROR RESUMEN SUCURSALES:", error);
  }
}

async function cargarMovimientosAPI() {
  if (!contenedorMovimientos) return;

  try {
    let url = `${API_URL}/api/movimientos`;
    if (usuarioActivo?.rol === "admin" && sucursalSeleccionada) {
      url += `?sucursal=${sucursalSeleccionada}`;
    }

    const respuesta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al cargar movimientos");

    movimientos = data;
    actualizarDashboardMovimientos(movimientos);
    poblarFiltrosMovimientos(movimientos);
    aplicarFiltroMovimientos();
  } catch (error) {
    console.error("ERROR MOVIMIENTOS:", error);
    contenedorMovimientos.innerHTML = `<p class="mensaje-vacio">No se pudo cargar el historial.</p>`;
  }
}

function actualizarDashboardMovimientos(lista) {
  const hoy = new Date().toLocaleDateString("es-AR");
  const movimientosHoy = lista.filter((m) =>
    new Date(m.createdAt).toLocaleDateString("es-AR") === hoy
  );

  const creados   = movimientosHoy.filter((m) => m.accion === "CREAR").length;
  const editados  = movimientosHoy.filter((m) => m.accion === "EDITAR").length;
  const eliminados= movimientosHoy.filter((m) => m.accion === "ELIMINAR").length;

  if (totalCrear)   totalCrear.textContent   = creados;
  if (totalEditar)  totalEditar.textContent  = editados;
  if (totalEliminar)totalEliminar.textContent= eliminados;
}

function poblarFiltrosMovimientos(lista) {
  const selectSuc = document.querySelector("#filtroSucursalMov");
  const selectUsr = document.querySelector("#filtroUsuarioMov");
  if (!selectSuc || !selectUsr) return;

  // Obtener valores únicos
  const sucursalesUnicas = [...new Set(lista.map(m => m.sucursal?.nombre).filter(Boolean))].sort();
  const usuariosUnicos   = [...new Set(lista.map(m => m.usuario?.nombre).filter(Boolean))].sort();

  const valSuc = selectSuc.value;
  const valUsr = selectUsr.value;

  selectSuc.innerHTML = '<option value="todas">Todas las sucursales</option>' +
    sucursalesUnicas.map(s => `<option value="${s}">${s}</option>`).join("");

  selectUsr.innerHTML = '<option value="todos">Todos los usuarios</option>' +
    usuariosUnicos.map(u => `<option value="${u}">${u}</option>`).join("");

  // Restaurar selección previa si existe
  if (valSuc) selectSuc.value = valSuc;
  if (valUsr) selectUsr.value = valUsr;
}

function aplicarFiltroMovimientos() {
  const texto = buscarMovimiento?.value.toLowerCase().trim() || "";
  const accionSeleccionada = filtroAccion?.value || "todos";
  const sucursalSelecMov   = document.querySelector("#filtroSucursalMov")?.value || "todas";
  const usuarioSelecMov    = document.querySelector("#filtroUsuarioMov")?.value  || "todos";

  const ahora = new Date();

  movimientosFiltradosActuales = movimientos.filter((m) => {
    const coincideTexto =
      (m.accion?.toLowerCase() || "").includes(texto) ||
      (m.nombreProducto?.toLowerCase() || "").includes(texto) ||
      (m.lote?.toLowerCase() || "").includes(texto) ||
      (m.usuario?.nombre?.toLowerCase() || "").includes(texto) ||
      (m.sucursal?.nombre?.toLowerCase() || "").includes(texto) ||
      (m.detalle?.toLowerCase() || "").includes(texto);

    const coincideAccion = accionSeleccionada === "todos" || m.accion === accionSeleccionada;

    // Filtro de fechas
    let coincideFecha = true;
    const fechaMov = new Date(m.createdAt);

    if (filtroFechaDias === -2 && (filtroFechaDesdeVal || filtroFechaHastaVal)) {
      // Rango personalizado
      if (filtroFechaDesdeVal) {
        const desde = new Date(filtroFechaDesdeVal);
        desde.setHours(0, 0, 0, 0);
        if (fechaMov < desde) coincideFecha = false;
      }
      if (filtroFechaHastaVal) {
        const hasta = new Date(filtroFechaHastaVal);
        hasta.setHours(23, 59, 59, 999);
        if (fechaMov > hasta) coincideFecha = false;
      }
    } else if (filtroFechaDias === 0) {
      // Hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      coincideFecha = fechaMov >= hoy;
    } else if (filtroFechaDias > 0) {
      // Últimos N días
      const limite = new Date(ahora - filtroFechaDias * 24 * 60 * 60 * 1000);
      coincideFecha = fechaMov >= limite;
    }
    // filtroFechaDias === -1 → todos, no filtra

    const coincideSucursal = sucursalSelecMov === "todas" ||
      (m.sucursal?.nombre || "") === sucursalSelecMov;

    const coincideUsuario = usuarioSelecMov === "todos" ||
      (m.usuario?.nombre || "") === usuarioSelecMov;

    return coincideTexto && coincideAccion && coincideFecha && coincideSucursal && coincideUsuario;
  });

  renderizarMovimientosPaginados();
}

function renderizarMovimientosPaginados() {
  const totalPaginas = Math.max(1, Math.ceil(movimientosFiltradosActuales.length / movimientosPorPagina));

  if (paginaMovimientos > totalPaginas) paginaMovimientos = totalPaginas;

  const inicio = (paginaMovimientos - 1) * movimientosPorPagina;
  const fin = inicio + movimientosPorPagina;

  renderizarMovimientos(movimientosFiltradosActuales.slice(inicio, fin));

  if (paginaActualMovimientos) {
    paginaActualMovimientos.textContent = `Página ${paginaMovimientos} de ${totalPaginas}`;
  }
  if (btnAnteriorMovimientos) btnAnteriorMovimientos.disabled = paginaMovimientos <= 1;
  if (btnSiguienteMovimientos) btnSiguienteMovimientos.disabled = paginaMovimientos >= totalPaginas;
}

function paginaAnteriorMovimientos() {
  if (paginaMovimientos > 1) { paginaMovimientos--; renderizarMovimientosPaginados(); }
}

function paginaSiguienteMovimientos() {
  const totalPaginas = Math.max(1, Math.ceil(movimientosFiltradosActuales.length / movimientosPorPagina));
  if (paginaMovimientos < totalPaginas) { paginaMovimientos++; renderizarMovimientosPaginados(); }
}

function renderizarMovimientos(listaMovimientos) {
  contenedorMovimientos.innerHTML = "";

  if (!listaMovimientos || listaMovimientos.length === 0) {
    contenedorMovimientos.innerHTML = `<p class="mensaje-vacio">No hay movimientos para mostrar.</p>`;
    return;
  }

  listaMovimientos.forEach((movimiento) => {
    const card = document.createElement("article");
    const claseAccion = movimiento.accion.toLowerCase();
    card.classList.add("card-movimiento", claseAccion);

    card.innerHTML = `
      <div class="movimiento-header">
        <span class="accion-movimiento ${claseAccion}">${obtenerTextoAccion(movimiento.accion)}</span>
        <span class="fecha-movimiento">${formatearFechaHora(movimiento.createdAt)}</span>
      </div>
      <h3>${movimiento.nombreProducto}</h3>
      <p><strong>Lote:</strong> ${movimiento.lote || "Sin lote"}</p>
      <p><strong>Usuario:</strong> ${movimiento.usuario?.nombre || "Sin datos"}</p>
      <p><strong>Sucursal:</strong> ${movimiento.sucursal?.nombre || "Sin sucursal"}</p>
      <p><strong>Detalle:</strong> ${movimiento.detalle || "Sin detalle"}</p>
    `;

    contenedorMovimientos.appendChild(card);
  });
}

function obtenerTextoAccion(accion) {
  if (accion === "CREAR")   return "🟢 Crear";
  if (accion === "EDITAR")  return "✏️ Editar";
  if (accion === "ELIMINAR")return "🗑️ Eliminar";
  return "📋 Movimiento";
}

function exportarMovimientos() {
  const lista = movimientosFiltradosActuales.length ? movimientosFiltradosActuales : movimientos;

  if (lista.length === 0) {
    Swal.fire({ icon: "info", title: "Sin movimientos", text: "No hay movimientos para exportar." });
    return;
  }

  if (window.XLSX) {
    exportarMovimientosXLSX(lista);
  } else {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.onload = () => exportarMovimientosXLSX(lista);
    script.onerror = () => exportarMovimientosCSV(lista);
    document.head.appendChild(script);
  }
}

formRegistro.addEventListener("submit", registrarUsuario);

async function registrarUsuario(e) {
  e.preventDefault();

  const nuevoUsuario = {
    nombre: document.querySelector("#registroNombre").value.trim(),
    email: document.querySelector("#registroEmail").value.trim(),
    password: document.querySelector("#registroPassword").value.trim(),
    nombreSucursal: document.querySelector("#registroSucursal").value.trim(),
    direccionSucursal: document.querySelector("#registroDireccion").value.trim()
  };

  try {
    const respuesta = await fetch(`${API_URL}/api/usuarios/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoUsuario)
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al registrar usuario");

    guardarSesion(data);
    formRegistro.reset();
    mostrarApp();

    if (usuarioActivo.rol === "admin") {
      await cargarSucursalesAPI();
      await cargarResumenSucursales();
    }

    await cargarProductosAPI();
    await cargarMovimientosAPI();

    Swal.fire({ icon: "success", title: "Sucursal registrada", text: "El usuario fue creado correctamente.", timer: 1800, showConfirmButton: false });
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error", text: error.message });
  }
}

formLogin.addEventListener("submit", iniciarSesion);

async function iniciarSesion(e) {
  e.preventDefault();

  const datosLogin = {
    email: document.querySelector("#loginEmail").value.trim(),
    password: document.querySelector("#loginPassword").value.trim()
  };

  try {
    const respuesta = await fetch(`${API_URL}/api/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosLogin)
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al iniciar sesión");

    guardarSesion(data);
    formLogin.reset();
    mostrarApp();

    if (usuarioActivo.rol === "admin") {
      await cargarSucursalesAPI();
      await cargarResumenSucursales();
    }

    await cargarProductosAPI();
    await cargarMovimientosAPI();

    Swal.fire({ icon: "success", title: "Bienvenido", text: `Ingresaste como ${data.nombre}`, timer: 1600, showConfirmButton: false });
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error", text: error.message });
  }
}

function guardarSesion(data) {
  token = data.token;
  usuarioActivo = {
    _id: data._id,
    nombre: data.nombre,
    email: data.email,
    rol: data.rol,
    sucursal: data.sucursal
  };
  localStorage.setItem("tokenStockAlert", token);
  localStorage.setItem("usuarioStockAlert", JSON.stringify(usuarioActivo));
}

btnCerrarSesion.addEventListener("click", cerrarSesion);

function cerrarSesion() {
  token = "";
  usuarioActivo = null;
  productos = [];
  movimientos = [];
  movimientosFiltradosActuales = [];
  productosFiltradosActuales = [];
  sucursales = [];
  sucursalSeleccionada = "";
  paginaMovimientos = 1;
  paginaProductos = 1;

  localStorage.removeItem("tokenStockAlert");
  localStorage.removeItem("usuarioStockAlert");

  const selectorAdmin = document.querySelector("#selectorSucursalAdmin");
  if (selectorAdmin) selectorAdmin.remove();

  if (resumenSucursales) resumenSucursales.innerHTML = "";
  if (contenedorMovimientos) contenedorMovimientos.innerHTML = "";
  if (buscarMovimiento) buscarMovimiento.value = "";
  if (filtroAccion) filtroAccion.value = "todos";

  actualizarDashboardMovimientos([]);
  renderizarProductos([]);
  actualizarResumen([]);
  mostrarAuth();

  Swal.fire({ icon: "success", title: "Sesión cerrada", timer: 1200, showConfirmButton: false });
}

async function cargarProductosAPI() {
  mostrarSkeleton(true);
  try {
    let url = `${API_URL}/api/productos`;
    if (usuarioActivo?.rol === "admin" && sucursalSeleccionada) {
      url += `?sucursal=${sucursalSeleccionada}`;
    }

    const respuesta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al cargar productos");

    productos = data.map(normalizarProducto);
    mostrarSkeleton(false);
    renderizarProductos(productos);
    actualizarResumen(productos);
    mostrarAlertasVencimiento();
    actualizarGraficos(productos);
    actualizarPanelPremium(productos);
    if (usuarioActivo?.rol === "admin") cargarComparativoSucursales();
  } catch (error) {
    mostrarSkeleton(false);
    Swal.fire({ icon: "error", title: "Error de conexión", text: "No se pudieron cargar los productos de la sucursal." });
  }
}

function normalizarProducto(producto) {
  return {
    ...producto,
    id: (producto._id || producto.id)?.toString(),
    vencimiento: producto.vencimiento?.split("T")[0] || producto.vencimiento,
    lote: producto.lote || ""
  };
}

function obtenerNombreSucursalProducto(producto) {
  if (producto.sucursal && typeof producto.sucursal === "object") {
    return producto.sucursal.nombre || "Sin sucursal";
  }
  const sucursalEncontrada = sucursales.find((s) => s._id === producto.sucursal);
  return sucursalEncontrada?.nombre || "";
}

function obtenerNombreUsuario(usuario) {
  if (!usuario) return "Sin datos";
  if (typeof usuario === "object") return usuario.nombre || usuario.email || "Sin datos";
  return "Sin datos";
}

function formatearFechaHora(fecha) {
  if (!fecha) return "Sin datos";
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// ========================= //
// PRODUCTOS CON PAGINACIÓN  //
// ========================= //

function renderizarProductos(listaProductos) {
  productosFiltradosActuales = listaProductos;
  paginaProductos = 1;
  renderizarProductosPaginados();
}

function renderizarProductosPaginados() {
  const total = productosFiltradosActuales.length;
  const totalPaginas = Math.max(1, Math.ceil(total / productosPorPagina));

  if (paginaProductos > totalPaginas) paginaProductos = totalPaginas;

  const inicio = (paginaProductos - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const pagina = productosFiltradosActuales.slice(inicio, fin);

  contenedorProductos.innerHTML = "";

  if (pagina.length === 0) {
    contenedorProductos.innerHTML = `<p class="mensaje-vacio">No hay productos para mostrar.</p>`;
    renderizarBotonesPaginacionProductos(totalPaginas);
    return;
  }

  // ===== VISTA TABLA PROFESIONAL =====
  if (vistaActual === "tabla") {
    contenedorProductos.classList.add("vista-tabla");
    const tabla = document.createElement("table");
    tabla.className = "tabla-productos";
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Producto</th>
          <th>Categoría</th>
          ${usuarioActivo?.rol === "admin" ? "<th>Sucursal</th>" : ""}
          <th>Stock</th>
          <th>Precio</th>
          <th>Lote</th>
          <th>Vencimiento</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${pagina.map((producto) => {
          const estado = obtenerEstadoProducto(producto.vencimiento);
          const estadoStock = obtenerEstadoStock(producto.stock);
          const claseBorde = obtenerClaseBordeProducto(estado.clase, estadoStock.clase);
          return `
            <tr class="${claseBorde}" style="border-left:3px solid ${estado.clase === 'vencido' ? 'var(--red)' : estado.clase === 'por-vencer' ? 'var(--yellow)' : 'var(--green)'}">
              <td><strong>${producto.nombre}</strong></td>
              <td>${producto.categoria}</td>
              ${usuarioActivo?.rol === "admin" ? `<td>${obtenerNombreSucursalProducto(producto) || "—"}</td>` : ""}
              <td>
                <span class="${estadoStock.clase === 'agotado' ? 'fecha-vencida' : estadoStock.clase === 'stock-critico' ? 'fecha-por-vencer' : ''}">${producto.stock}</span>
              </td>
              <td>$${Number(producto.precio).toLocaleString("es-AR")}</td>
              <td>${producto.lote || "—"}</td>
              <td class="${estado.clase === 'vencido' ? 'fecha-vencida' : estado.clase === 'por-vencer' ? 'fecha-por-vencer' : ''}">${formatearFecha(producto.vencimiento)}</td>
              <td>
                <span class="estado ${estado.clase}">${estado.texto}</span>
                <span class="estado-stock ${estadoStock.clase}">${estadoStock.texto}</span>
              </td>
              <td>
                <div class="prod-tabla-acciones">
                  <button class="btn-editar" data-id="${producto.id}">Editar</button>
                  <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
                  ${usuarioActivo?.rol === "admin" ? `<button class="btn-transferir" onclick="transferirProducto('${producto.id}')">↗</button>` : ""}
                </div>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    `;
    contenedorProductos.appendChild(tabla);
  } else {
    // ===== VISTA CARDS / LISTA =====
    contenedorProductos.classList.remove("vista-tabla");
    pagina.forEach((producto) => {
      const estado = obtenerEstadoProducto(producto.vencimiento);
      const estadoStock = obtenerEstadoStock(producto.stock);
      const nombreSucursalProducto = obtenerNombreSucursalProducto(producto);
      const creadoPor = obtenerNombreUsuario(producto.creadoPor);
      const actualizadoPor = obtenerNombreUsuario(producto.actualizadoPor);
      const fechaActualizacion = formatearFechaHora(producto.fechaUltimaActualizacion || producto.updatedAt);
      const claseBorde = obtenerClaseBordeProducto(estado.clase, estadoStock.clase);

      const card = document.createElement("article");
      card.classList.add("card-producto", estado.clase, estadoStock.clase, claseBorde);

      const pid = String(producto.id || producto._id || "");

      // Contenido de la card sin botones
      card.innerHTML = `
        <h3>${producto.nombre}</h3>
        ${usuarioActivo?.rol === "admin" ? `<p><strong>Sucursal:</strong> ${nombreSucursalProducto}</p>` : ""}
        <p><strong>Categoría:</strong> ${producto.categoria}</p>
        <p><strong>Stock:</strong> ${producto.stock}</p>
        <p><strong>Precio:</strong> $${Number(producto.precio).toLocaleString("es-AR")}</p>
        <p><strong>EAN:</strong> ${producto.codigoBarras || "Sin EAN"}</p>
        <p><strong>Lote:</strong> ${producto.lote || "Sin lote"}</p>
        <p><strong>Vencimiento:</strong> ${formatearFecha(producto.vencimiento)}</p>
        <hr>
        <p><strong>Creado por:</strong> ${creadoPor}</p>
        <p><strong>Última edición:</strong> ${actualizadoPor}</p>
        <p><strong>Actualizado:</strong> ${fechaActualizacion}</p>
        <span class="estado ${estado.clase}">${estado.texto}</span>
        <span class="estado-stock ${estadoStock.clase}">${estadoStock.texto}</span>
      `;

      // Crear botones con createElement para garantizar que los listeners funcionen
      const divBotones = document.createElement("div");
      divBotones.className = "botones";

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn-editar";
      btnEdit.textContent = "Editar";
      btnEdit.type = "button";
      btnEdit.setAttribute("onclick", "editarProducto('" + pid + "')");
      divBotones.appendChild(btnEdit);

      const btnDel = document.createElement("button");
      btnDel.className = "btn-eliminar";
      btnDel.textContent = "Eliminar";
      btnDel.type = "button";
      btnDel.setAttribute("onclick", "eliminarProducto('" + pid + "')");
      divBotones.appendChild(btnDel);

      if (usuarioActivo?.rol === "admin") {
        const btnTrans = document.createElement("button");
        btnTrans.className = "btn-transferir";
        btnTrans.textContent = "↗";
        btnTrans.type = "button";
        btnTrans.title = "Transferir a otra sucursal";
        btnTrans.setAttribute("onclick", "transferirProducto('" + pid + "')");
        divBotones.appendChild(btnTrans);
      }

      card.appendChild(divBotones);
      contenedorProductos.appendChild(card);
    });
  }

  renderizarBotonesPaginacionProductos(totalPaginas);

  const info = document.querySelector("#infoProductos");
  if (info) {
    info.textContent = total > 0
      ? `Mostrando ${inicio + 1}–${Math.min(fin, total)} de ${total} productos`
      : "";
  }

  // Aplicar vista actual
  aplicarClaseVista();
}

function renderizarBotonesPaginacionProductos(totalPaginas) {
  const contenedor = document.querySelector("#paginacionProductos");
  if (!contenedor) return;

  contenedor.innerHTML = "";
  if (totalPaginas <= 1) return;

  // Anterior
  const btnAnterior = document.createElement("button");
  btnAnterior.textContent = "← Anterior";
  btnAnterior.disabled = paginaProductos <= 1;
  btnAnterior.addEventListener("click", () => {
    if (paginaProductos > 1) { paginaProductos--; renderizarProductosPaginados(); scrollToProductos(); }
  });
  contenedor.appendChild(btnAnterior);

  // Números con "..."
  const rango = 2;
  for (let i = 1; i <= totalPaginas; i++) {
    if (
      i === 1 ||
      i === totalPaginas ||
      (i >= paginaProductos - rango && i <= paginaProductos + rango)
    ) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === paginaProductos) btn.classList.add("activa");
      btn.addEventListener("click", () => {
        paginaProductos = i;
        renderizarProductosPaginados();
        scrollToProductos();
      });
      contenedor.appendChild(btn);
    } else if (
      i === paginaProductos - rango - 1 ||
      i === paginaProductos + rango + 1
    ) {
      const sep = document.createElement("span");
      sep.textContent = "…";
      sep.className = "pag-info";
      contenedor.appendChild(sep);
    }
  }

  // Siguiente
  const btnSiguiente = document.createElement("button");
  btnSiguiente.textContent = "Siguiente →";
  btnSiguiente.disabled = paginaProductos >= totalPaginas;
  btnSiguiente.addEventListener("click", () => {
    if (paginaProductos < totalPaginas) { paginaProductos++; renderizarProductosPaginados(); scrollToProductos(); }
  });
  contenedor.appendChild(btnSiguiente);
}

function scrollToProductos() {
  const sec = contenedorProductos?.closest("section");
  if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ========================= //

function obtenerEstadoProducto(fechaVencimiento) {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diferenciaDias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

  if (diferenciaDias < 0)  return { texto: "Vencido",       clase: "vencido" };
  if (diferenciaDias <= 7) return { texto: "Por vencer",    clase: "por-vencer" };
  return                          { texto: "En buen estado", clase: "ok" };
}

function obtenerEstadoStock(stock) {
  if (stock <= 0)  return { texto: "Agotado",       clase: "agotado" };
  if (stock <= 5)  return { texto: "Stock crítico", clase: "stock-critico" };
  if (stock <= 10) return { texto: "Stock bajo",    clase: "stock-bajo" };
  return                  { texto: "Stock normal",  clase: "stock-normal" };
}

function obtenerClaseBordeProducto(estado, stock) {
  if (stock === "stock-normal")  return `borde-${estado}`;
  if (stock === "stock-bajo")    return `borde-${estado}-stock-bajo`;
  if (stock === "stock-critico") return `borde-${estado}-stock-critico`;
  if (stock === "agotado")       return `borde-${estado}-agotado`;
  return `borde-${estado}`;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
}

formProducto.addEventListener("submit", agregarProducto);

async function agregarProducto(e) {
  e.preventDefault();

  const nombre      = document.querySelector("#nombre").value.trim();
  const categoria   = document.querySelector("#categoria").value;
  const precio      = Number(document.querySelector("#precio").value);
  const codigoBarras= codigoBarrasInput.value.trim();

  const filasLotes = document.querySelectorAll(".fila-lote");
  const lotes = Array.from(filasLotes).map((fila) => ({
    numero:      fila.querySelector(".lote-numero").value.trim(),
    stock:       Number(fila.querySelector(".lote-stock").value),
    vencimiento: fila.querySelector(".lote-vencimiento").value
  })).filter((lote) => lote.stock >= 0 && lote.vencimiento);

  if (!nombre || !categoria || precio <= 0 || lotes.length === 0) {
    Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Completá todos los campos correctamente." });
    return;
  }

  const stockTotal          = lotes.reduce((t, l) => t + l.stock, 0);
  const lotePrincipal       = lotes[0].numero || "";
  const vencimientoPrincipal= lotes.map((l) => l.vencimiento).sort()[0];

  const nuevoProducto = { nombre, categoria, precio, codigoBarras, lote: lotePrincipal, stock: stockTotal, vencimiento: vencimientoPrincipal, lotes };

  // Si es admin, asignar sucursal
  if (usuarioActivo?.rol === "admin") {
    if (sucursalSeleccionada) {
      nuevoProducto.sucursal = sucursalSeleccionada;
    } else if (sucursales.length > 0) {
      // Pedir al admin que seleccione una sucursal
      const opcionesSuc = sucursales.map(s => `<option value="${s._id}">${s.nombre}</option>`).join("");
      const { value: sucursalElegida, isConfirmed } = await Swal.fire({
        title: "¿A qué sucursal asignar el producto?",
        html: `<select id="swalSucursal" class="swal2-input" style="width:85%;margin:0 auto;display:block">
          <option value="">Seleccioná una sucursal</option>
          ${opcionesSuc}
        </select>`,
        confirmButtonText: "Confirmar",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const val = document.getElementById("swalSucursal").value;
          if (!val) { Swal.showValidationMessage("Seleccioná una sucursal"); return false; }
          return val;
        }
      });
      if (!isConfirmed) return;
      nuevoProducto.sucursal = sucursalElegida;
    }
  }

  try {
    const respuesta = await fetch(`${API_URL}/api/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(nuevoProducto)
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al agregar producto");

    productos.push(normalizarProducto(data));
    aplicarFiltros();

    if (usuarioActivo?.rol === "admin") await cargarResumenSucursales();
    await cargarMovimientosAPI();

    formProducto.reset();
    Swal.fire({ icon: "success", title: "Producto agregado", text: "El producto fue guardado correctamente.", timer: 1800, showConfirmButton: false });
  } catch (error) {
    console.error("ERROR PRODUCTO:", error);
    Swal.fire({ icon: "error", title: "Error", text: error.message });
  }
}

// Delegación robusta para botones de productos
function manejarClickProductos(e) {
  // Ignorar clicks dentro del modal FAB o Swal
  if (e.target.closest("#fabModalOverlay")) return;
  if (e.target.closest(".swal2-container")) return;

  const btn = e.target.closest(".btn-editar, .btn-eliminar, .btn-transferir");
  if (!btn) return;

  // Si el botón ya tiene onclick propio (transferir), dejar que se ejecute solo
  if (btn.getAttribute("onclick")) return;

  const id = btn.dataset.id;
  if (!id || id === "undefined") return;

  if (btn.classList.contains("btn-eliminar")) {
    e.stopPropagation();
    eliminarProducto(id);
  } else if (btn.classList.contains("btn-editar")) {
    e.stopPropagation();
    editarProducto(id);
  } else if (btn.classList.contains("btn-transferir")) {
    e.stopPropagation();
    transferirProducto(id);
  }
}

document.addEventListener("click", manejarClickProductos);

async function eliminarProducto(idProducto) {
  Swal.fire({
    title: "¿Eliminar producto?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then(async (resultado) => {
    if (resultado.isConfirmed) {
      try {
        const respuesta = await fetch(`${API_URL}/api/productos/${idProducto}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.mensaje || "Error al eliminar producto");

        productos = productos.filter((p) => p.id !== idProducto);
        aplicarFiltros();

        if (usuarioActivo?.rol === "admin") await cargarResumenSucursales();
        await cargarMovimientosAPI();

        Swal.fire({ icon: "success", title: "Eliminado", text: `El producto fue eliminado por ${data.eliminadoPor?.nombre || usuarioActivo.nombre}.`, timer: 1800, showConfirmButton: false });
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el producto." });
      }
    }
  });
}

function editarProducto(idProducto) {
  const productoEncontrado = productos.find((p) => String(p.id) === String(idProducto) || String(p._id) === String(idProducto));
  if (!productoEncontrado) {
    Swal.fire({ icon:"error", title:"Error", text:"Producto no encontrado (id: "+idProducto+")" });
    return;
  }

  Swal.fire({
    title: "Editar producto",
    html: `
      <input id="editarNombre" class="swal2-input" placeholder="Nombre del producto" value="${productoEncontrado.nombre}">
      <select id="editarCategoria" class="swal2-input">
        <option value="Lácteos">Lácteos</option>
        <option value="Bebidas">Bebidas</option>
        <option value="Almacén">Almacén</option>
        <option value="Limpieza">Limpieza</option>
        <option value="Congelados">Congelados</option>
      </select>
      <input id="editarStock" type="number" class="swal2-input" placeholder="Stock" value="${productoEncontrado.stock}">
      <input id="editarPrecio" type="number" class="swal2-input" placeholder="Precio" value="${productoEncontrado.precio}">
      <input id="editarVencimiento" type="date" class="swal2-input" value="${productoEncontrado.vencimiento}">
      <input id="editarCodigoBarras" class="swal2-input" placeholder="EAN / Código EAN-13" value="${productoEncontrado.codigoBarras || ""}">
      <input id="editarLote" class="swal2-input" placeholder="Lote del producto" value="${productoEncontrado.lote || ""}">
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar cambios",
    cancelButtonText: "Cancelar",
    didOpen: () => { document.querySelector("#editarCategoria").value = productoEncontrado.categoria; },
    preConfirm: () => {
      const nombre      = document.querySelector("#editarNombre").value.trim();
      const categoria   = document.querySelector("#editarCategoria").value;
      const stock       = Number(document.querySelector("#editarStock").value);
      const precio      = Number(document.querySelector("#editarPrecio").value);
      const vencimiento = document.querySelector("#editarVencimiento").value;
      const codigoBarras= document.querySelector("#editarCodigoBarras").value.trim();
      const lote        = document.querySelector("#editarLote").value.trim();

      if (!nombre || !categoria || stock < 0 || precio <= 0 || !vencimiento) {
        Swal.showValidationMessage("Completá todos los campos correctamente");
        return false;
      }
      return { nombre, categoria, stock, precio, vencimiento, codigoBarras, lote };
    }
  }).then(async (resultado) => {
    if (resultado.isConfirmed) {
      try {
        const respuesta = await fetch(`${API_URL}/api/productos/${idProducto}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(resultado.value)
        });
        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.mensaje || "Error al actualizar producto");

        productos = productos.map((p) => p.id === idProducto ? normalizarProducto(data) : p);
        aplicarFiltros();

        if (usuarioActivo?.rol === "admin") await cargarResumenSucursales();
        await cargarMovimientosAPI();

        Swal.fire({ icon: "success", title: "Producto actualizado", timer: 1500, showConfirmButton: false });
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar el producto." });
      }
    }
  });
}

buscador.addEventListener("input", aplicarFiltros);
filtroCategoria.addEventListener("change", aplicarFiltros);
filtroEstado.addEventListener("change", aplicarFiltros);
ordenar.addEventListener("change", aplicarFiltros);
btnModoOscuro.addEventListener("click", cambiarModoOscuro);
btnLimpiarFiltros.addEventListener("click", limpiarFiltros);

function aplicarFiltros() {
  const textoBusqueda       = buscador.value.toLowerCase();
  const categoriaSeleccionada = filtroCategoria.value;
  const estadoSeleccionado    = filtroEstado.value;
  const ordenSeleccionado     = ordenar.value;

  let productosFiltrados = productos.filter((producto) => {
    const coincideBusqueda =
      producto.nombre.toLowerCase().includes(textoBusqueda) ||
      (producto.codigoBarras || "").toLowerCase().includes(textoBusqueda) ||
      (producto.lote || "").toLowerCase().includes(textoBusqueda);

    const coincideCategoria = categoriaSeleccionada === "todas" || producto.categoria === categoriaSeleccionada;
    const estadoProducto    = obtenerEstadoProducto(producto.vencimiento).clase;
    const coincideEstado    = estadoSeleccionado === "todos" || estadoSeleccionado === estadoProducto;

    return coincideBusqueda && coincideCategoria && coincideEstado;
  });

  if (ordenSeleccionado === "nombre")      productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (ordenSeleccionado === "stock")       productosFiltrados.sort((a, b) => a.stock - b.stock);
  if (ordenSeleccionado === "vencimiento") productosFiltrados.sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));

  renderizarProductos(productosFiltrados);
  actualizarResumen(productos);
}

function limpiarFiltros() {
  buscador.value = "";
  filtroCategoria.value = "todas";
  filtroEstado.value = "todos";
  ordenar.value = "";

  renderizarProductos(productos);
  actualizarResumen(productos);

  Swal.fire({ icon: "success", title: "Búsqueda limpia", timer: 1200, showConfirmButton: false });
}

function actualizarResumen(listaProductos) {
  const cantidadTotal     = listaProductos.length;
  const cantidadPorVencer = listaProductos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "por-vencer").length;
  const cantidadVencidos  = listaProductos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "vencido").length;
  const cantidadStockBajo = listaProductos.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const cantidadAgotados  = listaProductos.filter((p) => p.stock === 0).length;
  const valorTotal        = listaProductos.reduce((t, p) => t + p.stock * p.precio, 0);

  totalProductos.textContent      = cantidadTotal;
  productosPorVencer.textContent  = cantidadPorVencer;
  productosVencidos.textContent   = cantidadVencidos;
  productosStockBajo.textContent  = cantidadStockBajo;
  productosAgotados.textContent   = cantidadAgotados;
  valorInventario.textContent     = valorTotal.toLocaleString("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0
  });
}

function mostrarAlertasVencimiento() {
  const vencidosLista  = productos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "vencido");
  const porVencerLista = productos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "por-vencer");

  if (vencidosLista.length === 0 && porVencerLista.length === 0) return;

  const totalAlertas = vencidosLista.length + porVencerLista.length;

  // Mostrar máximo 3 productos de cada categoría en el popup
  const MAX_PREVIEW = 3;

  function buildPreview(lista, color, etiqueta) {
    if (lista.length === 0) return "";
    const preview = lista.slice(0, MAX_PREVIEW);
    const resto   = lista.length - MAX_PREVIEW;
    const items   = preview.map((p) =>
      `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>
        <span style="font-size:.88rem;font-weight:600;color:#1e293b;">${p.nombre}</span>
        ${p.lote ? `<span style="font-size:.75rem;color:#94a3b8;margin-left:auto;">Lote ${p.lote}</span>` : ""}
      </div>`
    ).join("");

    const masItems = resto > 0
      ? `<p style="font-size:.78rem;color:#94a3b8;margin-top:6px;text-align:right;">+ ${resto} más...</p>`
      : "";

    return `
      <div style="margin-bottom:14px;text-align:left;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="background:${color};color:white;font-size:.7rem;font-weight:800;padding:3px 8px;border-radius:999px;">${lista.length}</span>
          <span style="font-size:.82rem;font-weight:700;color:${color};">${etiqueta}</span>
        </div>
        <div style="background:#f8fafc;border-radius:10px;padding:4px 12px;">
          ${items}
        </div>
        ${masItems}
      </div>
    `;
  }

  const html = `
    <div style="text-align:left;">
      ${buildPreview(vencidosLista,  "#dc2626", "Productos vencidos")}
      ${buildPreview(porVencerLista, "#f59e0b", "Próximos a vencer")}
      <p style="font-size:.75rem;color:#94a3b8;text-align:center;margin-top:4px;">
        Revisá el panel de alertas para ver el listado completo
      </p>
    </div>
  `;

  Swal.fire({
    title: `🚨 ${totalAlertas} producto${totalAlertas !== 1 ? "s" : ""} requieren atención`,
    html,
    confirmButtonText: "Ver alertas",
    showCancelButton: true,
    cancelButtonText: "Cerrar",
    width: Math.min(window.innerWidth - 32, 480),
    customClass: {
      popup: "swal-alerta-compacta",
      title: "swal-alerta-titulo"
    }
  });
}

function cambiarModoOscuro() {
  document.body.classList.toggle("light");
  localStorage.setItem("modoClaro", JSON.stringify(document.body.classList.contains("light")));
}

function aplicarModoGuardado() {
  if (JSON.parse(localStorage.getItem("modoClaro") || "false")) {
    document.body.classList.add("light");
  }
}

async function iniciarEscaner() {
  if (escanerActivo) { await detenerEscaner(); return; }

  // Buscar dinámicamente por si la variable global quedó null
  const lectorEl = document.getElementById("lectorCodigo");
  if (!lectorEl) {
    Swal.fire({ icon: "error", title: "Error", text: "No se encontró el elemento del escáner." });
    return;
  }
  lectorEl.classList.remove("oculto");
  html5QrCode = new Html5Qrcode("lectorCodigo");

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 120 } },
      async (codigoDetectado) => {
        codigoBarrasInput.value = codigoDetectado;
        await detenerEscaner();
        Swal.fire({ icon: "success", title: "EAN detectado", text: codigoDetectado, timer: 1500, showConfirmButton: false });
      }
    );
    escanerActivo = true;
    if (btnEscanear) {
      btnEscanear.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> Detener escáner`;
    }
  } catch (error) {
    const lectorElStop = document.getElementById("lectorCodigo");
  if (lectorElStop) lectorElStop.classList.add("oculto");
    Swal.fire({ icon: "error", title: "Error de cámara", text: "No se pudo acceder a la cámara." });
  }
}

async function detenerEscaner() {
  if (html5QrCode && escanerActivo) {
    await html5QrCode.stop();
    await html5QrCode.clear();
  }
  const lectorElStop = document.getElementById("lectorCodigo");
  if (lectorElStop) lectorElStop.classList.add("oculto");
  escanerActivo = false;
  html5QrCode = null;
  if (btnEscanear) {
    btnEscanear.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> Escanear EAN`;
  }
}

function exportarExcel() {
  if (productos.length === 0) {
    Swal.fire({ icon: "info", title: "Sin productos", text: "No hay productos para exportar." });
    return;
  }

  // Usar SheetJS si está disponible, sino CSV compatible con Excel
  if (window.XLSX) {
    exportarXLSX();
  } else {
    // Cargar SheetJS dinámicamente
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.onload = exportarXLSX;
    script.onerror = exportarCSVCompatible;
    document.head.appendChild(script);
  }
}

function exportarXLSX() {
  const XLSX = window.XLSX;

  // Encabezados
  const encabezados = ["Producto","Lote","Categoría","Stock","Precio","EAN","Vencimiento","Estado","Estado Stock","Sucursal","Creado por","Última edición","Fecha actualización"];

  const filas = productos.map((p) => [
    p.nombre,
    p.lote || "",
    p.categoria,
    Number(p.stock),
    Number(p.precio),
    p.codigoBarras || "",
    formatearFecha(p.vencimiento),
    obtenerEstadoProducto(p.vencimiento).texto,
    obtenerEstadoStock(p.stock).texto,
    obtenerNombreSucursalProducto(p),
    obtenerNombreUsuario(p.creadoPor),
    obtenerNombreUsuario(p.actualizadoPor),
    formatearFechaHora(p.fechaUltimaActualizacion || p.updatedAt)
  ]);

  const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);

  // Ancho de columnas
  hoja["!cols"] = [20,12,12,8,10,16,14,14,14,16,16,16,20].map(w => ({ wch: w }));

  // Estilos de encabezado (solo con xlsx-style, aquí color básico)
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hoja, "Inventario");

  XLSX.writeFile(wb, `StockAlert-Inventario-${new Date().toLocaleDateString("es-AR").replace(/\//g,"-")}.xlsx`);

  Swal.fire({ icon: "success", title: "Exportado correctamente", text: "Archivo .xlsx listo para abrir en Excel.", timer: 1800, showConfirmButton: false });
}

function exportarCSVCompatible() {
  // CSV con BOM para que Excel lo abra correctamente con tildes
  let csv = "\uFEFF"; // BOM UTF-8
  csv += "Producto\tLote\tCategoría\tStock\tPrecio\tEAN\tVencimiento\tEstado\tEstado Stock\tSucursal\tCreado por\tÚltima edición\tActualizado\n";

  productos.forEach((p) => {
    const fila = [
      p.nombre, p.lote || "", p.categoria, p.stock, p.precio,
      p.codigoBarras || "", formatearFecha(p.vencimiento),
      obtenerEstadoProducto(p.vencimiento).texto, obtenerEstadoStock(p.stock).texto,
      obtenerNombreSucursalProducto(p), obtenerNombreUsuario(p.creadoPor),
      obtenerNombreUsuario(p.actualizadoPor), formatearFechaHora(p.fechaUltimaActualizacion || p.updatedAt)
    ].map(v => String(v).replace(/\t/g, " "));
    csv += fila.join("\t") + "\n";
  });

  const blob = new Blob([csv], { type: "text/tab-separated-values;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `StockAlert-Inventario-${Date.now()}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);

  Swal.fire({ icon: "success", title: "Exportado", text: "CSV compatible con Excel.", timer: 1600, showConfirmButton: false });
}

function importarExcel() {
  const archivo = inputImportar.files[0];

  if (!archivo) {
    Swal.fire({ icon: "warning", title: "Seleccioná un archivo", text: "Primero elegí un archivo CSV para importar." });
    return;
  }

  const lector = new FileReader();

  lector.onload = async function (e) {
    const contenido = e.target.result;
    const lineas = contenido.split("\n").filter((l) => l.trim() !== "");
    const encabezados = lineas[0].split(",").map((h) => h.trim().replaceAll('"', "").toLowerCase());

    const productosImportados = lineas.slice(1).map((linea) => {
      const valores = linea.split(",").map((v) => v.trim().replaceAll('"', ""));
      const producto = {};
      encabezados.forEach((enc, i) => { producto[enc] = valores[i]; });

      const productoFinal = {
        nombre:      producto.producto || producto.nombre,
        lote:        producto.lote || "",
        categoria:   producto.categoría || producto.categoria,
        stock:       Number(producto.stock),
        precio:      Number(producto.precio),
        codigoBarras:producto.ean || producto.codigobarras || "",
        vencimiento: convertirFechaImportada(producto.vencimiento)
      };

      if (usuarioActivo?.rol === "admin" && sucursalSeleccionada) {
        productoFinal.sucursal = sucursalSeleccionada;
      }

      return productoFinal;
    });

    const productosValidos = productosImportados.filter((p) =>
      p.nombre && p.categoria && !Number.isNaN(p.stock) && !Number.isNaN(p.precio) && p.vencimiento
    );

    if (productosValidos.length === 0) {
      Swal.fire({ icon: "error", title: "Archivo inválido", text: "No se encontraron productos válidos para importar." });
      return;
    }

    try {
      for (const producto of productosValidos) {
        const respuesta = await fetch(`${API_URL}/api/productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(producto)
        });
        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.mensaje || "Error al importar producto");
        productos.push(normalizarProducto(data));
      }

      aplicarFiltros();
      actualizarResumen(productos);
      if (usuarioActivo?.rol === "admin") await cargarResumenSucursales();
      await cargarMovimientosAPI();

      inputImportar.value = "";
      Swal.fire({ icon: "success", title: "Importación completa", text: `Se importaron ${productosValidos.length} productos.`, timer: 1800, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error al importar", text: error.message });
    }
  };

  lector.readAsText(archivo, "UTF-8");
}

function convertirFechaImportada(fecha) {
  if (!fecha) return "";
  if (fecha.includes("-")) return fecha;
  if (fecha.includes("/")) {
    const partes = fecha.split("/");
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2,"0")}-${partes[0].padStart(2,"0")}`;
    }
  }
  return fecha;
}

function actualizarGraficos(listaProductos) {
  if (!window.Chart) return;

  destruirGraficos();

  const totalOk        = listaProductos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "ok").length;
  const totalPorVencer = listaProductos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "por-vencer").length;
  const totalVencidos  = listaProductos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "vencido").length;

  const categorias = {};
  listaProductos.forEach((p) => {
    if (!categorias[p.categoria]) categorias[p.categoria] = { cantidad: 0, stock: 0, valor: 0 };
    categorias[p.categoria].cantidad += 1;
    categorias[p.categoria].stock   += Number(p.stock || 0);
    categorias[p.categoria].valor   += Number(p.stock || 0) * Number(p.precio || 0);
  });

  const nombresCategorias = Object.keys(categorias);

  const coloresEstado = ["#22c55e", "#facc15", "#dc2626"];
  const colorBarra    = "#3b82f6";

  if (graficoEstados) {
    chartEstados = new Chart(graficoEstados, {
      type: "doughnut",
      data: {
        labels: ["En buen estado", "Por vencer", "Vencidos"],
        datasets: [{ data: [totalOk, totalPorVencer, totalVencidos], backgroundColor: coloresEstado, borderWidth: 2, borderColor: "#fff" }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { font: { size: 11 } } } }
      }
    });
  }

  if (graficoCategorias) {
    chartCategorias = new Chart(graficoCategorias, {
      type: "bar",
      data: {
        labels: nombresCategorias,
        datasets: [{ label: "Productos", data: nombresCategorias.map((c) => categorias[c].cantidad), backgroundColor: colorBarra, borderRadius: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } }, x: { grid: { display: false } } }
      }
    });
  }

  if (graficoStockCategorias) {
    chartStockCategorias = new Chart(graficoStockCategorias, {
      type: "bar",
      data: {
        labels: nombresCategorias,
        datasets: [{ label: "Stock", data: nombresCategorias.map((c) => categorias[c].stock), backgroundColor: "#06b6d4", borderRadius: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } }, x: { grid: { display: false } } }
      }
    });
  }

  if (graficoValorInventario) {
    chartValorInventario = new Chart(graficoValorInventario, {
      type: "bar",
      data: {
        labels: nombresCategorias,
        datasets: [{ label: "Valor inventario", data: nombresCategorias.map((c) => categorias[c].valor), backgroundColor: "#22c55e", borderRadius: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } }, x: { grid: { display: false } } }
      }
    });
  }
}

function destruirGraficos() {
  if (chartEstados)        chartEstados.destroy();
  if (chartCategorias)     chartCategorias.destroy();
  if (chartStockCategorias)chartStockCategorias.destroy();
  if (chartValorInventario)chartValorInventario.destroy();
  chartEstados = chartCategorias = chartStockCategorias = chartValorInventario = null;
}

function actualizarPanelPremium(listaProductos) {
  const kpiCriticos       = document.querySelector("#kpiCriticos");
  const kpiValorRiesgo    = document.querySelector("#kpiValorRiesgo");
  const kpiVencenHoy      = document.querySelector("#kpiVencenHoy");
  const kpiSucursalCritica= document.querySelector("#kpiSucursalCritica");
  const kpiSucursalSub    = document.querySelector("#kpiSucursalSub");
  const tablaUrgencias    = document.querySelector("#tablaUrgencias");
  const rankingRiesgo     = document.querySelector("#rankingRiesgo");

  if (!kpiCriticos || !tablaUrgencias) return;

  const vencidos   = listaProductos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "vencido");
  const porVencer  = listaProductos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "por-vencer");
  const criticos   = listaProductos.filter((p) => {
    const s = obtenerEstadoStock(Number(p.stock || 0)).clase;
    return s === "stock-critico" || s === "agotado";
  });

  const productosEnRiesgo = [...vencidos, ...porVencer, ...criticos];
  const valorRiesgo = productosEnRiesgo.reduce((t, p) => t + Number(p.stock || 0) * Number(p.precio || 0), 0);

  kpiCriticos.textContent    = criticos.length;
  kpiValorRiesgo.textContent = valorRiesgo.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  kpiVencenHoy.textContent   = porVencer.length;

  // Tendencias
  calcularTendencia(criticos.length,  kpiPrevio.criticos,    "kpiCriticosTend");
  calcularTendencia(porVencer.length, kpiPrevio.porVencer,   "kpiVencenTend");

  // Guardar para próxima comparación
  kpiPrevio.criticos   = criticos.length;
  kpiPrevio.porVencer  = porVencer.length;
  kpiPrevio.valorRiesgo= valorRiesgo;

  const conteoSucursales = {};
  productosEnRiesgo.forEach((p) => {
    const nombre = obtenerNombreSucursalProducto(p) || "Sin sucursal";
    conteoSucursales[nombre] = (conteoSucursales[nombre] || 0) + 1;
  });

  const entradaCritica = Object.entries(conteoSucursales).sort((a, b) => b[1] - a[1])[0];
  if (kpiSucursalCritica) kpiSucursalCritica.textContent = entradaCritica?.[0] || "-";
  if (kpiSucursalSub) kpiSucursalSub.textContent = entradaCritica ? `${entradaCritica[1]} productos en riesgo` : "Sin datos";

  // Badge alertas sidebar
  const badge = document.querySelector("#navBadgeAlertas");
  const totalAlertas = vencidos.length + porVencer.length;
  if (badge) {
    badge.textContent = totalAlertas;
    badge.classList.toggle("visible", totalAlertas > 0);
  }

  // Tabla urgencias
  const urgentes = [...vencidos, ...porVencer]
    .sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento))
    .slice(0, 10);

  tablaUrgencias.innerHTML = "";
  urgentes.forEach((producto) => {
    const estado    = obtenerEstadoProducto(producto.vencimiento);
    const prioridad = estado.clase === "vencido" ? "alta" : "media";
    const claseFecha= estado.clase === "vencido" ? "fecha-vencida" : "fecha-por-vencer";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td><strong>${producto.nombre}</strong></td>
      <td>${producto.lote || "Sin lote"}</td>
      <td>${obtenerNombreSucursalProducto(producto) || "Sin sucursal"}</td>
      <td class="${claseFecha}">${formatearFecha(producto.vencimiento)}</td>
      <td>${producto.stock}</td>
      <td><span class="badge badge-${prioridad === "alta" ? "red" : "orange"}">● ${prioridad === "alta" ? "Alta" : "Media"}</span></td>
    `;
    tablaUrgencias.appendChild(fila);
  });

  // Ranking
  if (!rankingRiesgo) return;

  const productosUnicos = [];
  listaProductos.forEach((p) => {
    const clave = `${p.nombre}-${p.lote || ""}-${p.vencimiento}`;
    if (!productosUnicos.some((u) => `${u.nombre}-${u.lote || ""}-${u.vencimiento}` === clave)) {
      productosUnicos.push(p);
    }
  });

  const productosRiesgosos = productosUnicos.map((p) => {
    const estado     = obtenerEstadoProducto(p.vencimiento);
    const estadoStock= obtenerEstadoStock(Number(p.stock || 0));
    let puntaje = 0;
    if (estado.clase === "vencido")          puntaje += 100;
    if (estado.clase === "por-vencer")       puntaje += 60;
    if (estadoStock.clase === "agotado")     puntaje += 50;
    if (estadoStock.clase === "stock-critico")puntaje += 40;
    if (estadoStock.clase === "stock-bajo")  puntaje += 25;
    const valor = Number(p.stock || 0) * Number(p.precio || 0);
    puntaje += Math.min(valor / 10000, 50);
    return { ...p, puntaje, valor };
  }).filter((p) => p.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 10);

  rankingRiesgo.innerHTML = "";

  if (productosRiesgosos.length === 0) {
    rankingRiesgo.innerHTML = `<p class="mensaje-vacio">No hay productos riesgosos.</p>`;
    return;
  }

  productosRiesgosos.forEach((producto, index) => {
    let nivel     = "medio";
    if (producto.puntaje >= 140) nivel = "alto";
    if (producto.puntaje < 100)  nivel = "bajo";

    let claseNum = "";
    if (index === 0) claseNum = "oro";
    else if (index === 1) claseNum = "plata";
    else if (index === 2) claseNum = "bronce";

    const card = document.createElement("div");
    card.classList.add("ranking-item");
    card.innerHTML = `
      <div class="rank-num ${claseNum}">${index + 1}</div>
      <div class="rank-info">
        <div class="rank-name">${producto.nombre}</div>
        <div class="rank-sub">Lote: ${producto.lote || "Sin lote"} · Vence: ${formatearFecha(producto.vencimiento)}</div>
      </div>
      <span class="rank-score">${Math.round(producto.puntaje)}</span>
    `;
    rankingRiesgo.appendChild(card);
  });
}

// ========================= //
// SKELETON LOADING          //
// ========================= //

function mostrarSkeleton(mostrar) {
  const skeleton = document.querySelector("#skeletonProductos");
  const contenedor = document.querySelector("#contenedorProductos");
  const paginacion = document.querySelector("#paginacionProductos");
  if (!skeleton) return;
  if (mostrar) {
    skeleton.classList.remove("oculto");
    if (contenedor) contenedor.innerHTML = "";
    if (paginacion) paginacion.innerHTML = "";
  } else {
    skeleton.classList.add("oculto");
  }
}

// ========================= //
// TOGGLE VISTA CARDS/LISTA  //
// ========================= //

function iniciarToggleVista() {
  const btnCards = document.querySelector("#btnVistaCards");
  const btnLista = document.querySelector("#btnVistaLista");
  const btnTabla = document.querySelector("#btnVistaTabla");

  const vistaGuardada = localStorage.getItem("vistaProductos") || "cards";
  vistaActual = vistaGuardada;
  actualizarBotonesVista();

  btnCards?.addEventListener("click", () => { vistaActual = "cards"; localStorage.setItem("vistaProductos","cards"); actualizarBotonesVista(); renderizarProductosPaginados(); });
  btnLista?.addEventListener("click", () => { vistaActual = "lista"; localStorage.setItem("vistaProductos","lista"); actualizarBotonesVista(); renderizarProductosPaginados(); });
  btnTabla?.addEventListener("click", () => { vistaActual = "tabla"; localStorage.setItem("vistaProductos","tabla"); actualizarBotonesVista(); renderizarProductosPaginados(); });
}

function actualizarBotonesVista() {
  const btnCards = document.querySelector("#btnVistaCards");
  const btnLista = document.querySelector("#btnVistaLista");
  const btnTabla = document.querySelector("#btnVistaTabla");
  [btnCards, btnLista, btnTabla].forEach(b => b?.classList.remove("activa"));
  if (vistaActual === "cards") btnCards?.classList.add("activa");
  if (vistaActual === "lista") btnLista?.classList.add("activa");
  if (vistaActual === "tabla") btnTabla?.classList.add("activa");
}

function aplicarClaseVista() {
  const cont = document.querySelector("#contenedorProductos");
  if (!cont) return;
  cont.classList.remove("vista-lista", "vista-tabla");
  if (vistaActual === "lista") cont.classList.add("vista-lista");
  if (vistaActual === "tabla") cont.classList.add("vista-tabla");
}

// ===== FILTRO FECHAS HISTORIAL =====
function iniciarFiltroFechas() {
  // Usar delegación en document para que funcione aunque el DOM no esté listo
  document.addEventListener("click", (e) => {
    // Chips de fecha
    if (e.target.classList.contains("fecha-chip")) {
      document.querySelectorAll(".fecha-chip").forEach(c => c.classList.remove("activa"));
      e.target.classList.add("activa");
      filtroFechaDias = parseInt(e.target.dataset.dias);
      filtroFechaDesdeVal = null;
      filtroFechaHastaVal = null;
      const fd = document.querySelector("#filtroFechaDesde");
      const fh = document.querySelector("#filtroFechaHasta");
      if (fd) fd.value = "";
      if (fh) fh.value = "";
      paginaMovimientos = 1;
      aplicarFiltroMovimientos();
    }

    // Limpiar fechas
    if (e.target.id === "btnLimpiarFechas") {
      filtroFechaDesdeVal = null;
      filtroFechaHastaVal = null;
      filtroFechaDias = -1;
      const fd = document.querySelector("#filtroFechaDesde");
      const fh = document.querySelector("#filtroFechaHasta");
      if (fd) fd.value = "";
      if (fh) fh.value = "";
      document.querySelectorAll(".fecha-chip").forEach(c => c.classList.remove("activa"));
      const chipTodos = document.querySelector('.fecha-chip[data-dias="-1"]');
      if (chipTodos) chipTodos.classList.add("activa");
      paginaMovimientos = 1;
      aplicarFiltroMovimientos();
    }
  });

  // Inputs de fecha con delegación
  document.addEventListener("change", (e) => {
    if (e.target.id === "filtroFechaDesde") {
      filtroFechaDesdeVal = e.target.value;
      filtroFechaDias = -2;
      document.querySelectorAll(".fecha-chip").forEach(c => c.classList.remove("activa"));
      paginaMovimientos = 1;
      aplicarFiltroMovimientos();
    }
    if (e.target.id === "filtroFechaHasta") {
      filtroFechaHastaVal = e.target.value;
      filtroFechaDias = -2;
      document.querySelectorAll(".fecha-chip").forEach(c => c.classList.remove("activa"));
      paginaMovimientos = 1;
      aplicarFiltroMovimientos();
    }
  });
}

// ===== SIDEBAR COLLAPSIBLE =====
function iniciarSidebarCollapse() {
  const btnCollapse   = document.querySelector("#btnCollapseSidebar");
  const btnHamburguesa= document.querySelector("#btnHamburguesa");
  const sidebar       = document.querySelector(".sidebar");
  const overlay       = document.querySelector("#sidebarOverlay");
  if (!btnCollapse || !sidebar) return;

  // Estado guardado
  const savedCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
  if (savedCollapsed) {
    sidebar.classList.add("collapsed");
    document.body.classList.add("sidebar-collapsed");
  }

  // Botón ☰ del topbar (desktop) — oculta/muestra completamente
  btnCollapse.addEventListener("click", () => {
    const isNowCollapsed = sidebar.classList.toggle("collapsed");
    document.body.classList.toggle("sidebar-collapsed", isNowCollapsed);
    localStorage.setItem("sidebarCollapsed", isNowCollapsed);
  });

  // Botón hamburguesa (mobile) — drawer lateral
  if (btnHamburguesa) {
    btnHamburguesa.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("open");
      overlay?.classList.toggle("show", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
  }

  // Cerrar con overlay en mobile
  overlay?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  });

  // Cerrar al navegar en mobile
  document.querySelectorAll(".nav-item").forEach(a => {
    a.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        sidebar.classList.remove("open");
        overlay?.classList.remove("show");
        document.body.style.overflow = "";
      }
      // Actualizar activo
      document.querySelectorAll(".nav-item").forEach(l => l.classList.remove("activo"));
      a.classList.add("activo");
    });
  });
}

// ========================= //
// BÚSQUEDA GLOBAL           //
// ========================= //

function iniciarBusquedaGlobal() {
  const input = document.querySelector("#busquedaGlobalInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const texto = input.value.trim().toLowerCase();
    const resultados = document.querySelector("#busquedaGlobalResultados");
    if (!resultados) return;

    if (!texto || texto.length < 2) {
      resultados.innerHTML = '<p class="busqueda-hint">Escribí para buscar en todo el inventario</p>';
      return;
    }

    if (!productos || productos.length === 0) {
      resultados.innerHTML = '<p class="busqueda-vacio">No hay productos cargados</p>';
      return;
    }

    const encontrados = productos.filter((p) =>
      p.nombre.toLowerCase().includes(texto) ||
      (p.codigoBarras || "").toLowerCase().includes(texto) ||
      (p.lote || "").toLowerCase().includes(texto) ||
      (p.categoria || "").toLowerCase().includes(texto)
    ).slice(0, 8);

    if (encontrados.length === 0) {
      resultados.innerHTML = '<p class="busqueda-vacio">Sin resultados para "' + texto + '"</p>';
      return;
    }

    resultados.innerHTML = encontrados.map((p) => {
      const estado     = obtenerEstadoProducto(p.vencimiento);
      const estadoStock= obtenerEstadoStock(p.stock);
      const colorEstado= estado.clase === "vencido" ? "#dc2626" : estado.clase === "por-vencer" ? "#f59e0b" : "#22c55e";
      const badgeColor = estado.clase === "vencido" ? "rgba(220,38,38,.12)" : estado.clase === "por-vencer" ? "rgba(245,158,11,.12)" : "rgba(34,197,94,.12)";
      const badgeText  = estado.clase === "vencido" ? "#991b1b" : estado.clase === "por-vencer" ? "#92400e" : "#166534";

      return `
        <div class="busqueda-resultado-item" onclick="irAProducto('${p.id}')">
          <span class="busqueda-resultado-estado" style="background:${colorEstado}"></span>
          <div class="busqueda-resultado-info">
            <div class="busqueda-resultado-nombre">${p.nombre}</div>
            <div class="busqueda-resultado-sub">${p.categoria} · Stock: ${p.stock} · Vence: ${formatearFecha(p.vencimiento)}</div>
          </div>
          <span class="busqueda-resultado-badge" style="background:${badgeColor};color:${badgeText}">${estado.texto}</span>
        </div>
      `;
    }).join("");
  });
}

function irAProducto(id) {
  // Cerrar búsqueda
  const overlay = document.querySelector("#busquedaOverlay");
  const input   = document.querySelector("#busquedaGlobalInput");
  if (overlay) overlay.classList.remove("activo");
  if (input)   input.value = "";

  // Limpiar filtros y buscar el producto
  const buscadorEl = document.querySelector("#buscador");
  const producto   = productos.find((p) => p.id === id);
  if (!producto || !buscadorEl) return;

  buscadorEl.value = producto.nombre;
  aplicarFiltros();

  // Scroll a la sección de productos
  setTimeout(() => {
    const sec = document.querySelector("#seccionProductos");
    if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

// ========================= //
// KPI TENDENCIAS            //
// ========================= //

function calcularTendencia(actual, anterior, elementoId) {
  const el = document.querySelector(`#${elementoId}`);
  if (!el || anterior === null) return;

  if (actual > anterior) {
    el.textContent = `↑ +${actual - anterior} vs antes`;
    el.className = "kpi-tendencia sube";
  } else if (actual < anterior) {
    el.textContent = `↓ -${anterior - actual} vs antes`;
    el.className = "kpi-tendencia baja";
  } else {
    el.textContent = "= Sin cambios";
    el.className = "kpi-tendencia igual";
  }
}

// ========================= //
// EXPORT MOVIMIENTOS XLSX   //
// ========================= //

function exportarMovimientosXLSX(lista) {
  const XLSX = window.XLSX;
  const encabezados = ["Fecha","Acción","Producto","Lote","Usuario","Sucursal","Detalle"];
  const filas = lista.map((m) => [
    formatearFechaHora(m.createdAt), m.accion, m.nombreProducto,
    m.lote || "Sin lote", m.usuario?.nombre || "Sin datos",
    m.sucursal?.nombre || "Sin sucursal", m.detalle || "Sin detalle"
  ]);

  const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);
  hoja["!cols"] = [20,10,20,12,16,16,30].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hoja, "Historial");
  XLSX.writeFile(wb, `StockAlert-Historial-${new Date().toLocaleDateString("es-AR").replace(/\//g,"-")}.xlsx`);

  Swal.fire({ icon: "success", title: "Historial exportado", text: "Archivo .xlsx listo para Excel.", timer: 1600, showConfirmButton: false });
}

function exportarMovimientosCSV(lista) {
  let csv = "\uFEFF";
  csv += "Fecha\tAcción\tProducto\tLote\tUsuario\tSucursal\tDetalle\n";
  lista.forEach((m) => {
    csv += [
      formatearFechaHora(m.createdAt), m.accion, m.nombreProducto,
      m.lote || "Sin lote", m.usuario?.nombre || "Sin datos",
      m.sucursal?.nombre || "Sin sucursal", m.detalle || "Sin detalle"
    ].join("\t") + "\n";
  });
  const blob = new Blob([csv], { type: "text/tab-separated-values;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `StockAlert-Historial-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ========================= //
// PANEL ADMIN AVANZADO      //
// ========================= //

async function cargarPanelAdminAvanzado() {
  if (usuarioActivo?.rol !== "admin") return;

  // Cargar usuarios
  await cargarUsuariosAdmin();

  // Cargar comparativo sucursales
  await cargarComparativoSucursales();
}

async function cargarUsuariosAdmin() {
  const contenedor = document.querySelector("#tablaUsuariosAdmin");
  if (!contenedor) return;

  // Mostrar loading
  contenedor.innerHTML = `<p class="mensaje-vacio">⏳ Cargando...</p>`;

  try {
    const respuesta = await fetch(`${API_URL}/api/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (respuesta.status === 404) {
      // Endpoint no existe en el backend — mostrar gestión de sucursales como alternativa
      contenedor.innerHTML = `
        <div class="admin-aviso">
          <p>⚠️ El endpoint <code>/api/usuarios</code> no está disponible en el backend.</p>
          <p>Podés gestionar las sucursales desde la sección de abajo:</p>
        </div>
      `;
      await cargarGestionSucursales(contenedor);
      return;
    }

    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error");

    if (data.length === 0) {
      contenedor.innerHTML = `<p class="mensaje-vacio">No hay usuarios registrados.</p>`;
      await cargarGestionSucursales(contenedor);
      return;
    }

    contenedor.innerHTML = `
      <div class="tabla-usuarios-wrap">
        <table class="tabla-admin">
          <thead>
            <tr>
              <th>Usuario</th><th>Email</th><th>Sucursal</th>
              <th>Rol</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((u) => `
              <tr class="${u.activo === false ? "usuario-inactivo" : ""}">
                <td><strong>${u.nombre}</strong></td>
                <td>${u.email}</td>
                <td>
                  <span>${u.sucursal?.nombre || "Sin sucursal"}</span>
                  ${u.sucursal?._id ? `<button class="btn-rename-suc" onclick="editarSucursal('${u.sucursal._id}')">✏️</button>` : ""}
                </td>
                <td>
                  <select class="select-rol" onchange="cambiarRolUsuario('${u._id}', this.value)">
                    <option value="admin"   ${u.rol === "admin"   ? "selected" : ""}>Admin</option>
                    <option value="jefe"    ${u.rol === "jefe"    ? "selected" : ""}>Jefe</option>
                    <option value="usuario" ${u.rol === "usuario" ? "selected" : ""}>Usuario</option>
                  </select>
                </td>
                <td>
                  <span class="badge-estado-usuario ${u.activo === false ? "inactivo" : "activo"}">
                    ${u.activo === false ? "Inactivo" : "Activo"}
                  </span>
                </td>
                <td>
                  <button class="btn-toggle-usuario" onclick="toggleActivarUsuario('${u._id}', ${u.activo !== false})">
                    ${u.activo === false ? "✅ Activar" : "🚫 Desactivar"}
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    // Agregar gestión de sucursales debajo de la tabla de usuarios
    const divSuc = document.createElement("div");
    divSuc.style.marginTop = "20px";
    contenedor.appendChild(divSuc);
    await cargarGestionSucursales(divSuc);

  } catch (error) {
    contenedor.innerHTML = `<p class="mensaje-vacio">Error al cargar usuarios.</p>`;
    await cargarGestionSucursales(contenedor);
  }
}

// ========================= //
// GESTIÓN DE SUCURSALES     //
// (funciona sin /api/usuarios)
// ========================= //

async function cargarGestionSucursales(contenedor) {
  if (!contenedor) return;

  // Usar el array de sucursales ya cargado
  if (!sucursales || sucursales.length === 0) {
    try {
      const respuesta = await fetch(`${API_URL}/api/sucursales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await respuesta.json();
      if (respuesta.ok) sucursales = data;
    } catch(e) {
      // ignorar
    }
  }

  if (!sucursales || sucursales.length === 0) {
    const div = document.createElement("div");
    div.innerHTML = `<p class="mensaje-vacio">No hay sucursales registradas.</p>`;
    contenedor.appendChild(div);
    return;
  }

  const div = document.createElement("div");
  div.innerHTML = `
    <h3 style="font-size:.85rem;font-weight:700;color:var(--text-1);margin-bottom:12px;padding-top:16px;border-top:1px solid var(--border)">
      🏪 Gestión de sucursales
    </h3>
    <div class="buscador-sucursales-wrap">
      <input
        type="text"
        class="buscador-sucursales"
        id="buscadorSucursales"
        placeholder="Buscar por nombre o número de sucursal..."
        autocomplete="off"
        spellcheck="false"
      >
    </div>
    <div class="sucursales-grid" id="gridSucursales">
      ${sucursales.map((s) => `
        <div class="sucursal-card" data-nombre="${s.nombre.toLowerCase()}" data-numero="${s.numero || s.nro || ""}">
          <div class="sucursal-card-header">
            <div class="sucursal-num">${s.numero || s.nro || s.nombre.charAt(0).toUpperCase()}</div>
            <div class="sucursal-info">
              <span class="sucursal-nombre">${s.nombre}</span>
              <small class="sucursal-dir">${s.direccion || "Sin dirección registrada"}</small>
            </div>
            <button
              class="btn-editar-sucursal"
              onclick="editarSucursal('${s._id}')"
              title="Editar sucursal"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
  contenedor.appendChild(div);

  // Buscador de sucursales
  const buscadorSuc = div.querySelector("#buscadorSucursales");
  buscadorSuc?.addEventListener("input", () => {
    const texto = buscadorSuc.value.toLowerCase().trim();
    div.querySelectorAll(".sucursal-card").forEach((card) => {
      const nombre = card.dataset.nombre || "";
      const numero = card.dataset.numero || "";
      const coincide = nombre.includes(texto) || numero.includes(texto);
      card.classList.toggle("oculta", !coincide);
    });
  });
}

async function cambiarRolUsuario(idUsuario, nuevoRol) {
  try {
    const respuesta = await fetch(`${API_URL}/api/usuarios/${idUsuario}/rol`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rol: nuevoRol })
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al cambiar rol");

    Swal.fire({ icon: "success", title: "Rol actualizado", text: `Usuario actualizado a ${nuevoRol}.`, timer: 1400, showConfirmButton: false });
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error", text: error.message });
    await cargarUsuariosAdmin(); // revertir UI
  }
}

async function toggleActivarUsuario(idUsuario, estaActivo) {
  const accion = estaActivo ? "desactivar" : "activar";

  const resultado = await Swal.fire({
    title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
    text: estaActivo ? "El usuario no podrá iniciar sesión." : "El usuario podrá volver a iniciar sesión.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: `Sí, ${accion}`,
    cancelButtonText: "Cancelar"
  });

  if (!resultado.isConfirmed) return;

  try {
    const respuesta = await fetch(`${API_URL}/api/usuarios/${idUsuario}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ activo: !estaActivo })
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error");

    Swal.fire({ icon: "success", title: `Usuario ${accion === "activar" ? "activado" : "desactivado"}`, timer: 1400, showConfirmButton: false });
    await cargarUsuariosAdmin();
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error", text: error.message });
  }
}

async function cargarSucursalesAdmin() {
  const contenedor = document.querySelector("#tablaSucursalesAdmin");
  if (!contenedor) return;

  contenedor.innerHTML = `<p style="color:var(--text-4);font-size:.82rem;padding:12px 0">Cargando sucursales...</p>`;

  try {
    // Intentar endpoint dedicado primero, sino usar el de resumen
    let sucursalesData = sucursales;

    if (!sucursalesData || sucursalesData.length === 0) {
      const resp = await fetch(`${API_URL}/api/sucursales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) sucursalesData = data;
    }

    // Traer también resumen para tener stats
    let resumenData = [];
    try {
      const respR = await fetch(`${API_URL}/api/sucursales/resumen`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataR = await respR.json();
      if (respR.ok) resumenData = dataR;
    } catch(e) {}

    if (!sucursalesData || sucursalesData.length === 0) {
      contenedor.innerHTML = `<p class="mensaje-vacio">No hay sucursales registradas.</p>`;
      return;
    }

    contenedor.innerHTML = `
      <div class="tabla-usuarios-wrap">
        <table class="tabla-admin">
          <thead>
            <tr>
              <th>N°</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Productos</th>
              <th>Vencidos</th>
              <th>Stock crítico</th>
              <th>Valor inventario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${sucursalesData.map((s) => {
              const resumen = resumenData.find(r => r.sucursal?._id === s._id) || {};
              return `
                <tr>
                  <td><strong>${s.numero || s.nro || s.num || (sucursalesData.indexOf(s) + 1)}</strong></td>
                  <td><strong>${s.nombre}</strong></td>
                  <td>${s.direccion || '<span style="color:var(--text-4)">Sin dirección</span>'}</td>
                  <td>${resumen.totalProductos ?? "—"}</td>
                  <td style="color:${(resumen.vencidos || 0) > 0 ? "var(--red)" : "var(--text-3)"}">
                    ${resumen.vencidos ?? "—"}
                  </td>
                  <td style="color:${(resumen.stockCritico || 0) > 0 ? "var(--orange)" : "var(--text-3)"}">
                    ${resumen.stockCritico ?? "—"}
                  </td>
                  <td>${resumen.valorInventario != null
                    ? resumen.valorInventario.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
                    : "—"
                  }</td>
                  <td>
                    <button
                      class="btn-edit-suc"
                      onclick="editarSucursal('${s._id}')"
                      title="Editar sucursal"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <p style="font-size:.7rem;color:var(--text-4);margin-top:10px;padding:8px 12px;background:rgba(99,102,241,.08);border-radius:8px;border-left:3px solid var(--brand)">
        💡 Hacé clic en <strong>✏️ Editar</strong> para cambiar el nombre, número o dirección de una sucursal.
      </p>
    `;
  } catch (error) {
    contenedor.innerHTML = `
      <div style="text-align:center;padding:24px">
        <p style="color:var(--text-4);font-size:.85rem;margin-bottom:8px">No se pudieron cargar las sucursales.</p>
        <p style="color:var(--text-4);font-size:.75rem">Requiere endpoint <code style="background:var(--bg-3);padding:2px 6px;border-radius:4px">/api/sucursales</code> en el backend.</p>
      </div>
    `;
  }
}

async function renombrarSucursal(idSucursal, nombreActual) {
  await editarSucursal(idSucursal);
}

async function editarSucursal(idSucursal) {
  // Buscar datos actuales de la sucursal
  const sucursal = sucursales.find(s => s._id === idSucursal);
  if (!sucursal) {
    Swal.fire({ icon: "error", title: "Error", text: "Sucursal no encontrada." });
    return;
  }

  const resultado = await Swal.fire({
    title: "✏️ Editar sucursal",
    html: `
      <div style="text-align:left;padding:0 4px">

        <label style="display:block;font-size:.75rem;font-weight:700;color:#94a3b8;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em">
          Número de sucursal
        </label>
        <input
          id="editSucNumero"
          type="number"
          class="swal2-input"
          placeholder="Ej: 1, 329, 42..."
          value="${sucursal.numero || sucursal.nro || ""}"
          min="1"
          style="width:100%;margin:0 0 14px"
        >

        <label style="display:block;font-size:.75rem;font-weight:700;color:#94a3b8;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em">
          Nombre de la sucursal
        </label>
        <input
          id="editSucNombre"
          type="text"
          class="swal2-input"
          placeholder="Ej: Sucursal Norte"
          value="${sucursal.nombre || ""}"
          style="width:100%;margin:0 0 14px"
        >

        <label style="display:block;font-size:.75rem;font-weight:700;color:#94a3b8;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em">
          Dirección <span style="font-weight:400;text-transform:none">(opcional)</span>
        </label>
        <input
          id="editSucDireccion"
          type="text"
          class="swal2-input"
          placeholder="Av. Corrientes 1234"
          value="${sucursal.direccion || ""}"
          style="width:100%;margin:0"
        >

        <p style="font-size:.7rem;color:#64748b;margin-top:12px;padding:8px 10px;background:rgba(99,102,241,.08);border-radius:7px;border-left:3px solid #6366f1">
          ⚠️ Cambiar el número de sucursal actualiza el identificador visible en todos los productos y reportes.
        </p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar cambios",
    cancelButtonText: "Cancelar",
    width: 480,
    preConfirm: () => {
      const nombre    = document.querySelector("#editSucNombre").value.trim();
      const numero    = document.querySelector("#editSucNumero").value.trim();
      const direccion = document.querySelector("#editSucDireccion").value.trim();

      if (!nombre) {
        Swal.showValidationMessage("El nombre es obligatorio");
        return false;
      }

      return { nombre, numero: numero ? Number(numero) : undefined, direccion };
    }
  });

  if (!resultado.isConfirmed) return;

  try {
    const respuesta = await fetch(`${API_URL}/api/sucursales/${idSucursal}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(resultado.value)
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al editar sucursal");

    // Actualizar localmente
    const idx = sucursales.findIndex(s => s._id === idSucursal);
    if (idx >= 0) {
      sucursales[idx].nombre    = resultado.value.nombre;
      sucursales[idx].direccion = resultado.value.direccion;
      if (resultado.value.numero) sucursales[idx].numero = resultado.value.numero;
    }

    const nroTexto = resultado.value.numero ? ` (N° ${resultado.value.numero})` : "";
    Swal.fire({
      icon: "success",
      title: "Sucursal actualizada",
      text: `"${resultado.value.nombre}"${nroTexto} guardada correctamente.`,
      timer: 2000,
      showConfirmButton: false
    });

    // Recargar todo
    await cargarSucursalesAdmin();
    await cargarUsuariosAdmin();
    await cargarComparativoSucursales();
    await cargarResumenSucursales();
    crearSelectorSucursales();

  } catch (error) {
    Swal.fire({ icon: "error", title: "Error", text: error.message });
  }
}

async function cargarComparativoSucursales() {
  const contenedor = document.querySelector("#comparativoSucursales");
  if (!contenedor) return;

  try {
    const respuesta = await fetch(`${API_URL}/api/sucursales/resumen`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje);

    if (!data || data.length === 0) {
      contenedor.innerHTML = `<p class="mensaje-vacio">Sin datos de sucursales.</p>`;
      return;
    }

    // Ranking por riesgo
    const ranking = [...data].sort((a, b) => (b.vencidos + b.porVencer) - (a.vencidos + a.porVencer));

    contenedor.innerHTML = `
      <div class="comparativo-grid">
        ${ranking.map((s, i) => {
          const riesgo = s.vencidos + s.porVencer;
          const colorRiesgo = riesgo === 0 ? "var(--verde)" : riesgo <= 3 ? "var(--amarillo)" : "var(--rojo)";
          return `
            <div class="card-comparativo">
              <div class="comparativo-header">
                <span class="comparativo-pos">${i + 1}</span>
                <h3>${s.sucursal.nombre}</h3>
                <span class="comparativo-riesgo" style="color:${colorRiesgo}">⚠️ ${riesgo} en riesgo</span>
              </div>
              <div class="comparativo-stats">
                <div class="stat-item"><span>${s.totalProductos}</span><small>Productos</small></div>
                <div class="stat-item"><span style="color:var(--amarillo)">${s.porVencer}</span><small>Por vencer</small></div>
                <div class="stat-item"><span style="color:var(--rojo)">${s.vencidos}</span><small>Vencidos</small></div>
                <div class="stat-item"><span style="color:var(--violeta)">${s.stockCritico}</span><small>Stock crítico</small></div>
                <div class="stat-item"><span style="color:var(--verde)">${s.valorInventario?.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }) || "$0"}</span><small>Valor</small></div>
              </div>
              <div class="comparativo-barra">
                <div class="barra-fill" style="width:${Math.min(100, riesgo * 10)}%;background:${colorRiesgo}"></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } catch (error) {
    contenedor.innerHTML = `<p class="mensaje-vacio">No se pudo cargar el comparativo.</p>`;
  }
}

async function transferirProducto(idProducto) {
  if (sucursales.length === 0) {
    Swal.fire({ icon: "warning", title: "Sin sucursales", text: "No hay sucursales disponibles." });
    return;
  }

  const producto = productos.find((p) => p.id === idProducto);
  if (!producto) return;

  const opcionesSucursales = sucursales
    .filter((s) => s._id !== (producto.sucursal?._id || producto.sucursal))
    .map((s) => `<option value="${s._id}">${s.nombre}</option>`)
    .join("");

  const resultado = await Swal.fire({
    title: `Transferir "${producto.nombre}"`,
    html: `
      <p style="margin-bottom:12px;color:#64748b;font-size:.9rem;">Seleccioná la sucursal destino</p>
      <select id="sucursalDestino" class="swal2-input" style="width:85%;margin:0 auto;display:block">
        ${opcionesSucursales}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: "Transferir",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const destino = document.querySelector("#sucursalDestino").value;
      if (!destino) { Swal.showValidationMessage("Seleccioná una sucursal"); return false; }
      return destino;
    }
  });

  if (!resultado.isConfirmed) return;

  try {
    // Armar el body completo para no romper validaciones del backend
    const bodyTransfer = {
      nombre:       producto.nombre,
      categoria:    producto.categoria,
      precio:       producto.precio,
      stock:        producto.stock,
      vencimiento:  producto.vencimiento,
      codigoBarras: producto.codigoBarras || "",
      lote:         producto.lote || "",
      sucursal:     resultado.value,
      lotes: (producto.lotes && producto.lotes.length > 0)
        ? producto.lotes
        : [{ numero: producto.lote || "", stock: producto.stock, vencimiento: producto.vencimiento }]
    };

    const respuesta = await fetch(`${API_URL}/api/productos/${idProducto}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(bodyTransfer)
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al transferir");

    // Recargar productos completos (sin filtro de sucursal temporalmente)
    const sucursalAnterior = sucursalSeleccionada;
    sucursalSeleccionada = "";
    await cargarProductosAPI();
    sucursalSeleccionada = sucursalAnterior;
    aplicarFiltros();
    await cargarResumenSucursales();
    await cargarComparativoSucursales();
    await cargarMovimientosAPI();

    const sucursalNombre = sucursales.find((s) => s._id === resultado.value)?.nombre || "otra sucursal";
    Swal.fire({ icon: "success", title: "Producto transferido", text: `Movido a ${sucursalNombre}.`, timer: 1800, showConfirmButton: false });
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error", text: error.message });
  }
}

// Configuración de alertas
async function abrirConfigAlertas() {
  const diasActual = parseInt(localStorage.getItem("diasAlertaVencimiento") || "7");
  const stockActual = parseInt(localStorage.getItem("umbralStockBajo") || "5");

  const resultado = await Swal.fire({
    title: "⚙️ Configurar alertas",
    html: `
      <div style="text-align:left;padding:0 8px">
        <label style="display:block;font-weight:700;margin-bottom:6px;font-size:.88rem;color:#334155">
          📅 Días de anticipación para alertar vencimientos
        </label>
        <input id="diasAlerta" type="number" min="1" max="60" value="${diasActual}"
          class="swal2-input" style="width:100%;margin:0 0 16px">

        <label style="display:block;font-weight:700;margin-bottom:6px;font-size:.88rem;color:#334155">
          📦 Umbral de stock bajo (unidades)
        </label>
        <input id="umbralStock" type="number" min="1" max="100" value="${stockActual}"
          class="swal2-input" style="width:100%;margin:0">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const dias   = parseInt(document.querySelector("#diasAlerta").value);
      const umbral = parseInt(document.querySelector("#umbralStock").value);
      if (isNaN(dias) || dias < 1)   { Swal.showValidationMessage("Días inválido"); return false; }
      if (isNaN(umbral) || umbral < 1){ Swal.showValidationMessage("Umbral inválido"); return false; }
      return { dias, umbral };
    }
  });

  if (!resultado.isConfirmed) return;

  localStorage.setItem("diasAlertaVencimiento", resultado.value.dias);
  localStorage.setItem("umbralStockBajo", resultado.value.umbral);

  Swal.fire({ icon: "success", title: "Configuración guardada", text: `Alertas: ${resultado.value.dias} días. Stock bajo: ≤${resultado.value.umbral} unidades.`, timer: 2000, showConfirmButton: false });

  // Re-renderizar con nueva configuración
  if (productos.length > 0) {
    renderizarProductos(productos);
    actualizarResumen(productos);
    actualizarPanelPremium(productos);
  }
}

// Modificar obtenerEstadoProducto para usar configuración dinámica
const _obtenerEstadoOriginal = obtenerEstadoProducto;
// Override dinámico
function obtenerEstadoProductoConf(fechaVencimiento) {
  const dias = parseInt(localStorage.getItem("diasAlertaVencimiento") || "7");
  const hoy  = new Date();
  const venc  = new Date(fechaVencimiento);
  const diff  = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  if (diff < 0)     return { texto: "Vencido",       clase: "vencido" };
  if (diff <= dias) return { texto: "Por vencer",    clase: "por-vencer" };
  return              { texto: "En buen estado", clase: "ok" };
}

function obtenerEstadoStockConf(stock) {
  const umbral = parseInt(localStorage.getItem("umbralStockBajo") || "5");
  if (stock <= 0)        return { texto: "Agotado",       clase: "agotado" };
  if (stock <= umbral)   return { texto: "Stock crítico", clase: "stock-critico" };
  if (stock <= umbral*2) return { texto: "Stock bajo",    clase: "stock-bajo" };
  return                        { texto: "Stock normal",  clase: "stock-normal" };
}

// ========================= //
// FAB SCANNER FLOTANTE      //
// MODO RÁFAGA               //
// ========================= //

let fabQrCode = null;
let fabEscanerActivo = false;
let fabSucursalFija = null; // sucursal fijada para modo ráfaga

function mostrarFAB() {
  const fab = document.getElementById("fabScanner");
  if (fab) fab.classList.add("visible");
}

function ocultarFAB() {
  const fab = document.getElementById("fabScanner");
  if (fab) fab.classList.remove("visible");
}

function iniciarFAB() {
  const fab = document.getElementById("fabScanner");
  if (!fab) return;
  fab.addEventListener("click", abrirFabModal);
  document.getElementById("fabModalClose")?.addEventListener("click", cerrarFabModal);
  document.getElementById("fabModalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "fabModalOverlay") cerrarFabModal();
  });
  document.getElementById("fabBtnGuardar")?.addEventListener("click", guardarProductoFAB);
  document.getElementById("fabBtnNuevoEscaneo")?.addEventListener("click", reiniciarFabEscaner);
}

async function abrirFabModal() {
  const overlay = document.getElementById("fabModalOverlay");
  if (!overlay) return;
  overlay.classList.add("activo");
  fabSucursalFija = sucursalSeleccionada || null;
  resetFabCampos();
  await iniciarFabScanner();
}

function resetFabCampos() {
  const ids = ["fabNombre","fabPrecio","fabLote","fabStock","fabVencimiento"];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  const cat = document.getElementById("fabCategoria");
  if (cat) cat.value = "";
  document.getElementById("fabEanDisplay").style.display = "none";
  document.getElementById("fabCampos").style.display     = "none";
  document.getElementById("fabBtnNuevoEscaneo").style.display = "none";
  document.getElementById("fabEanValor").textContent = "—";
  document.getElementById("fabBtnGuardar").dataset.ean = "";
  // Mostrar scanner
  document.getElementById("fabLectorCodigo").style.display = "block";
}

async function iniciarFabScanner() {
  const lectorEl = document.getElementById("fabLectorCodigo");
  if (!lectorEl) return;
  lectorEl.style.display = "block";
  lectorEl.innerHTML = ""; // limpiar instancia anterior

  try {
    fabQrCode = new Html5Qrcode("fabLectorCodigo");
    await fabQrCode.start(
      { facingMode: "environment" },
      { fps: 15, qrbox: { width: 260, height: 110 } },
      async (codigoDetectado) => {
        await detenerFabScanner();

        // Vibrar
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

        // Ocultar scanner, mostrar campos
        document.getElementById("fabLectorCodigo").style.display = "none";
        document.getElementById("fabEanValor").textContent = codigoDetectado;
        document.getElementById("fabEanDisplay").style.display = "flex";
        document.getElementById("fabCampos").style.display     = "flex";
        document.getElementById("fabBtnNuevoEscaneo").style.display = "block";
        document.getElementById("fabBtnGuardar").dataset.ean = codigoDetectado;

        // Focus en nombre
        setTimeout(() => document.getElementById("fabNombre")?.focus(), 100);
      }
    );
    fabEscanerActivo = true;
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error de cámara", text: "No se pudo acceder a la cámara." });
    cerrarFabModal();
  }
}

async function detenerFabScanner() {
  if (fabQrCode && fabEscanerActivo) {
    try { await fabQrCode.stop(); await fabQrCode.clear(); } catch(e) {}
  }
  fabEscanerActivo = false;
  fabQrCode = null;
}

async function reiniciarFabEscaner() {
  // Volver a modo escáner sin cerrar el modal
  resetFabCampos();
  await iniciarFabScanner();
}

async function cerrarFabModal() {
  await detenerFabScanner();
  document.getElementById("fabModalOverlay")?.classList.remove("activo");
  fabSucursalFija = null;
}

async function guardarProductoFAB() {
  const nombre      = document.getElementById("fabNombre").value.trim();
  const categoria   = document.getElementById("fabCategoria").value;
  const precio      = Number(document.getElementById("fabPrecio").value);
  const lote        = document.getElementById("fabLote").value.trim();
  const stock       = Number(document.getElementById("fabStock").value) || 0;
  const vencimiento = document.getElementById("fabVencimiento").value;
  const ean         = document.getElementById("fabBtnGuardar").dataset.ean || "";

  if (!nombre || !categoria || !precio || !vencimiento) {
    Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Completá nombre, categoría, precio y vencimiento." });
    return;
  }

  const nuevoProducto = {
    nombre, categoria, precio, codigoBarras: ean,
    lote, stock, vencimiento,
    lotes: [{ numero: lote, stock, vencimiento }]
  };

  // Asignar sucursal
  if (usuarioActivo?.rol === "admin") {
    if (fabSucursalFija) {
      nuevoProducto.sucursal = fabSucursalFija;
    } else if (sucursales.length > 0) {
      const opcs = sucursales.map(s => `<option value="${s._id}">${s.nombre}</option>`).join("");
      const { value: suc, isConfirmed } = await Swal.fire({
        title: "¿A qué sucursal?",
        html: `<select id="swalSucFab" class="swal2-input" style="width:85%;margin:0 auto;display:block"><option value="">Seleccioná</option>${opcs}</select>`,
        confirmButtonText: "Confirmar", showCancelButton: true,
        preConfirm: () => {
          const v = document.getElementById("swalSucFab").value;
          if (!v) { Swal.showValidationMessage("Seleccioná una sucursal"); return false; }
          return v;
        }
      });
      if (!isConfirmed) return;
      nuevoProducto.sucursal = suc;
      fabSucursalFija = suc; // fijar para próximos escaneos
    }
  }

  const btn = document.getElementById("fabBtnGuardar");
  const btnNuevo = document.getElementById("fabBtnNuevoEscaneo");
  btn.textContent = "Guardando...";
  btn.disabled = true;

  try {
    const respuesta = await fetch(`${API_URL}/api/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(nuevoProducto)
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al guardar");

    productos.push(normalizarProducto(data));
    aplicarFiltros();
    if (usuarioActivo?.rol === "admin") await cargarResumenSucursales();
    await cargarMovimientosAPI();

    // Mostrar éxito y volver a escanear automáticamente
    btn.textContent = "✓ Guardado";
    btn.style.background = "var(--green-bg)";
    btn.style.color = "var(--green)";

    setTimeout(async () => {
      btn.textContent = "Guardar producto";
      btn.style.background = "";
      btn.style.color = "";
      btn.disabled = false;
      // Volver a escanear automáticamente
      await reiniciarFabEscaner();
    }, 1200);

  } catch (error) {
    Swal.fire({ icon: "error", title: "Error", text: error.message });
    btn.textContent = "Guardar producto";
    btn.disabled = false;
  }
}