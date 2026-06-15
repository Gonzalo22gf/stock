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

// Paginación productos
let paginaProductos = 1;
const productosPorPagina = 20;

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

btnExportarMovimientos?.addEventListener("click", exportarMovimientos);
btnAnteriorMovimientos?.addEventListener("click", paginaAnteriorMovimientos);
btnSiguienteMovimientos?.addEventListener("click", paginaSiguienteMovimientos);

async function iniciarApp() {
  btnEscanear?.addEventListener("click", iniciarEscaner);
  aplicarModoGuardado();
  actualizarFechaTopbar();

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

  // Ocultar topbar y sidebar
  const topbar  = document.querySelector("#topbar");
  const sidebar = document.querySelector("#sidebar");
  if (topbar)  topbar.classList.add("oculto");
  if (sidebar) {
    sidebar.classList.add("oculto");
    // Quitar margen del contenido
    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.marginLeft = "0";
  }

  // Limpiar sidebar
  const sidebarNombreUsuario = document.querySelector("#sidebarNombreUsuario");
  const sidebarRolUsuario    = document.querySelector("#sidebarRolUsuario");
  const sidebarUser          = document.querySelector("#sidebarUser");
  const badge                = document.querySelector("#navBadgeAlertas");

  if (sidebarNombreUsuario) sidebarNombreUsuario.textContent = "—";
  if (sidebarRolUsuario)    sidebarRolUsuario.textContent    = "—";
  if (sidebarUser)          sidebarUser.style.display        = "none";
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

  // Mostrar topbar y sidebar
  const topbar  = document.querySelector("#topbar");
  const sidebar = document.querySelector("#sidebar");
  if (topbar)  topbar.classList.remove("oculto");
  if (sidebar) {
    sidebar.classList.remove("oculto");
    // Restaurar margen del contenido
    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.marginLeft = "";
  }

  // Mostrar sidebar user y actualizar avatar
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

function aplicarFiltroMovimientos() {
  const texto = buscarMovimiento?.value.toLowerCase().trim() || "";
  const accionSeleccionada = filtroAccion?.value || "todos";

  movimientosFiltradosActuales = movimientos.filter((m) => {
    const coincideTexto =
      (m.accion?.toLowerCase() || "").includes(texto) ||
      (m.nombreProducto?.toLowerCase() || "").includes(texto) ||
      (m.lote?.toLowerCase() || "").includes(texto) ||
      (m.usuario?.nombre?.toLowerCase() || "").includes(texto) ||
      (m.sucursal?.nombre?.toLowerCase() || "").includes(texto) ||
      (m.detalle?.toLowerCase() || "").includes(texto);

    const coincideAccion = accionSeleccionada === "todos" || m.accion === accionSeleccionada;

    return coincideTexto && coincideAccion;
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

  let csv = "Fecha,Acción,Producto,Lote,Usuario,Sucursal,Detalle\n";
  lista.forEach((m) => {
    csv += `"${formatearFechaHora(m.createdAt)}","${m.accion}","${m.nombreProducto}","${m.lote || "Sin lote"}","${m.usuario?.nombre || "Sin datos"}","${m.sucursal?.nombre || "Sin sucursal"}","${m.detalle || "Sin detalle"}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `stockalert-historial-${Date.now()}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);

  Swal.fire({ icon: "success", title: "Historial exportado", text: "Se descargó el archivo CSV.", timer: 1600, showConfirmButton: false });
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
  try {
    let url = `${API_URL}/api/productos`;
    if (usuarioActivo?.rol === "admin" && sucursalSeleccionada) {
      url += `?sucursal=${sucursalSeleccionada}`;
    }

    const respuesta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.mensaje || "Error al cargar productos");

    productos = data.map(normalizarProducto);

    renderizarProductos(productos);
    actualizarResumen(productos);
    mostrarAlertasVencimiento();
    actualizarGraficos(productos);
    actualizarPanelPremium(productos);
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error de conexión", text: "No se pudieron cargar los productos de la sucursal." });
  }
}

function normalizarProducto(producto) {
  return {
    ...producto,
    id: producto._id || producto.id,
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

    card.innerHTML = `
      <h3>${producto.nombre}</h3>
      ${usuarioActivo?.rol === "admin" ? `<p><strong>Sucursal:</strong> ${nombreSucursalProducto}</p>` : ""}
      <p><strong>Categoría:</strong> ${producto.categoria}</p>
      <p><strong>Stock:</strong> ${producto.stock}</p>
      <p><strong>Precio:</strong> $${producto.precio}</p>
      <p><strong>EAN:</strong> ${producto.codigoBarras || "Sin EAN"}</p>
      <p><strong>Lote:</strong> ${producto.lote || "Sin lote"}</p>
      <p><strong>Vencimiento:</strong> ${formatearFecha(producto.vencimiento)}</p>
      <hr>
      <p><strong>Creado por:</strong> ${creadoPor}</p>
      <p><strong>Última edición:</strong> ${actualizadoPor}</p>
      <p><strong>Actualizado:</strong> ${fechaActualizacion}</p>
      <span class="estado ${estado.clase}">${estado.texto}</span>
      <span class="estado-stock ${estadoStock.clase}">${estadoStock.texto}</span>
      <div class="botones">
        <button class="btn-editar" data-id="${producto.id}">Editar</button>
        <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
      </div>
    `;

    contenedorProductos.appendChild(card);
  });

  renderizarBotonesPaginacionProductos(totalPaginas);

  const info = document.querySelector("#infoProductos");
  if (info) {
    info.textContent = total > 0
      ? `Mostrando ${inicio + 1}–${Math.min(fin, total)} de ${total} productos`
      : "";
  }
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

  if (usuarioActivo?.rol === "admin" && sucursalSeleccionada) {
    nuevoProducto.sucursal = sucursalSeleccionada;
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

contenedorProductos.addEventListener("click", manejarBotonesProductos);

function manejarBotonesProductos(e) {
  const idProducto = e.target.dataset.id;
  if (e.target.classList.contains("btn-eliminar")) eliminarProducto(idProducto);
  if (e.target.classList.contains("btn-editar"))   editarProducto(idProducto);
}

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
  const productoEncontrado = productos.find((p) => p.id === idProducto);
  if (!productoEncontrado) return;

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
  const vencidosLista   = productos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "vencido");
  const porVencerLista  = productos.filter((p) => obtenerEstadoProducto(p.vencimiento).clase === "por-vencer");

  if (vencidosLista.length === 0 && porVencerLista.length === 0) return;

  let html = "";

  if (vencidosLista.length > 0) {
    html += `
      <div style="margin-bottom:20px; text-align:left;">
        <h3 style="color:#d90429;">Productos vencidos (${vencidosLista.length})</h3>
        <ul style="padding-left:20px;">
          ${vencidosLista.map((p) => `<li>${p.nombre} - Lote: ${p.lote || "Sin lote"}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  if (porVencerLista.length > 0) {
    html += `
      <div style="text-align:left;">
        <h3 style="color:#f4a261;">Productos por vencer (${porVencerLista.length})</h3>
        <ul style="padding-left:20px;">
          ${porVencerLista.map((p) => `<li>${p.nombre} - Lote: ${p.lote || "Sin lote"}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  Swal.fire({ icon: "warning", title: "Alerta de vencimientos", html, confirmButtonText: "Entendido", width: 600 });
}

function cambiarModoOscuro() {
  document.body.classList.toggle("modo-oscuro");
  localStorage.setItem("modoOscuro", JSON.stringify(document.body.classList.contains("modo-oscuro")));
}

function aplicarModoGuardado() {
  if (JSON.parse(localStorage.getItem("modoOscuro"))) {
    document.body.classList.add("modo-oscuro");
  }
}

async function iniciarEscaner() {
  if (escanerActivo) { await detenerEscaner(); return; }

  lectorCodigo.classList.remove("oculto");
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
    btnEscanear.textContent = "Detener escáner";
  } catch (error) {
    lectorCodigo.classList.add("oculto");
    Swal.fire({ icon: "error", title: "Error de cámara", text: "No se pudo acceder a la cámara." });
  }
}

async function detenerEscaner() {
  if (html5QrCode && escanerActivo) {
    await html5QrCode.stop();
    await html5QrCode.clear();
  }
  lectorCodigo.classList.add("oculto");
  escanerActivo = false;
  html5QrCode = null;
  btnEscanear.textContent = "📷 Escanear EAN";
}

function exportarExcel() {
  if (productos.length === 0) {
    Swal.fire({ icon: "info", title: "Sin productos", text: "No hay productos para exportar." });
    return;
  }

  let csv = "Producto,Lote,Categoría,Stock,Precio,EAN,Vencimiento,Estado,Estado stock,Sucursal,Creado por,Última edición,Actualizado\n";

  productos.forEach((p) => {
    csv += `"${p.nombre}","${p.lote || ""}","${p.categoria}",${p.stock},${p.precio},"${p.codigoBarras || "Sin EAN"}","${formatearFecha(p.vencimiento)}","${obtenerEstadoProducto(p.vencimiento).texto}","${obtenerEstadoStock(p.stock).texto}","${obtenerNombreSucursalProducto(p)}","${obtenerNombreUsuario(p.creadoPor)}","${obtenerNombreUsuario(p.actualizadoPor)}","${formatearFechaHora(p.fechaUltimaActualizacion || p.updatedAt)}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `stockalert-inventario-${Date.now()}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);

  Swal.fire({ icon: "success", title: "Inventario exportado", text: "Se descargó el archivo CSV.", timer: 1600, showConfirmButton: false });
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
      <td><span class="badge-prioridad ${prioridad}">🔔 ${prioridad === "alta" ? "Alta" : "Media"}</span></td>
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

    const card = document.createElement("article");
    card.classList.add("item-riesgo", nivel);
    card.innerHTML = `
      <div class="item-riesgo-num ${claseNum}">${index + 1}</div>
      <div class="item-riesgo-info">
        <div class="item-riesgo-nombre">${producto.nombre}</div>
        <div class="item-riesgo-sub">Lote: ${producto.lote || "Sin lote"} · Vence: ${formatearFecha(producto.vencimiento)}</div>
      </div>
      <span class="puntaje-riesgo">${Math.round(producto.puntaje)}</span>
    `;
    rankingRiesgo.appendChild(card);
  });
}