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
const btnEscanear = document.querySelector("#btnEscanear");
const lectorCodigo = document.querySelector("#lectorCodigo");

const inputImportar = document.querySelector("#inputImportar");
const btnImportarExcel = document.querySelector("#btnImportarExcel");
const btnExportarExcel = document.querySelector("#btnExportarExcel");

btnImportarExcel?.addEventListener("click", importarExcel);
btnExportarExcel?.addEventListener("click", exportarExcel);

let productos = [];
let sucursales = [];
let sucursalSeleccionada = "";

let token = localStorage.getItem("tokenStockAlert") || "";
let usuarioActivo = JSON.parse(localStorage.getItem("usuarioStockAlert")) || null;

let escanerActivo = false;
let html5QrCode = null;

document.addEventListener("DOMContentLoaded", iniciarApp);

async function iniciarApp() {
  btnEscanear?.addEventListener("click", iniciarEscaner);

  aplicarModoGuardado();

  if (token && usuarioActivo) {
    mostrarApp();

    if (usuarioActivo.rol === "admin") {
      await cargarSucursalesAPI();
      await cargarResumenSucursales();
    }

    await cargarProductosAPI();
  } else {
    mostrarAuth();
  }
}

function mostrarAuth() {
  seccionAuth.classList.remove("oculto");
  seccionUsuario.classList.add("oculto");

  seccionesApp.forEach((seccion) => {
    seccion.classList.add("oculto");
  });

  panelAdminGlobal?.classList.add("oculto");
}

function mostrarApp() {
  seccionAuth.classList.add("oculto");
  seccionUsuario.classList.remove("oculto");

  seccionesApp.forEach((seccion) => {
    seccion.classList.remove("oculto");
  });

  nombreUsuario.textContent = usuarioActivo.nombre;

  if (usuarioActivo.rol === "admin") {
    nombreSucursal.textContent = "Rol: Administrador";
    panelAdminGlobal?.classList.remove("oculto");
  } else {
    nombreSucursal.textContent = `Sucursal: ${
      usuarioActivo.sucursal?.nombre || "Sin sucursal"
    }`;

    panelAdminGlobal?.classList.add("oculto");
  }
}

function crearSelectorSucursales() {
  if (usuarioActivo?.rol !== "admin") return;

  const selectorExistente = document.querySelector("#selectorSucursalAdmin");

  if (selectorExistente) {
    selectorExistente.remove();
  }

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
      ${sucursales
        .map(
          (sucursal) =>
            `<option value="${sucursal._id}">${sucursal.nombre}</option>`
        )
        .join("")}
    </select>
  `;

  nombreSucursal.insertAdjacentElement("afterend", contenedorSelector);

  const filtroSucursalAdmin = document.querySelector("#filtroSucursalAdmin");

  filtroSucursalAdmin.value = sucursalSeleccionada;

  filtroSucursalAdmin.addEventListener("change", async (e) => {
    sucursalSeleccionada = e.target.value;
    await cargarProductosAPI();
    await cargarResumenSucursales();
  });
}

async function cargarSucursalesAPI() {
  try {
    const respuesta = await fetch(`${API_URL}/api/sucursales`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || "Error al cargar sucursales");
    }

    sucursales = data;
    crearSelectorSucursales();
  } catch (error) {
    console.error("ERROR SUCURSALES:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar las sucursales."
    });
  }
}

async function cargarResumenSucursales() {
  if (usuarioActivo?.rol !== "admin") return;

  try {
    const respuesta = await fetch(`${API_URL}/api/sucursales/resumen`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || "Error al cargar resumen");
    }

    resumenSucursales.innerHTML = "";

    if (data.length === 0) {
      resumenSucursales.innerHTML = `
        <p class="mensaje-vacio">No hay sucursales para mostrar.</p>
      `;
      return;
    }

    let resumenFinal;

    if (sucursalSeleccionada) {
      resumenFinal = data.find(
        (item) => item.sucursal._id === sucursalSeleccionada
      );
    } else {
      resumenFinal = {
        sucursal: {
          nombre: "Todas las sucursales"
        },
        totalProductos: data.reduce(
          (total, item) => total + item.totalProductos,
          0
        ),
        porVencer: data.reduce((total, item) => total + item.porVencer, 0),
        vencidos: data.reduce((total, item) => total + item.vencidos, 0),
        stockCritico: data.reduce(
          (total, item) => total + item.stockCritico,
          0
        ),
        agotados: data.reduce((total, item) => total + item.agotados, 0),
        valorInventario: data.reduce(
          (total, item) => total + item.valorInventario,
          0
        )
      };
    }

    if (!resumenFinal) {
      resumenSucursales.innerHTML = `
        <p class="mensaje-vacio">No hay datos para esta sucursal.</p>
      `;
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
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0
        })}</p>
      </article>
    `;
  } catch (error) {
    console.error("ERROR RESUMEN SUCURSALES:", error);
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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(nuevoUsuario)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || "Error al registrar usuario");
    }

    guardarSesion(data);
    formRegistro.reset();
    mostrarApp();

    if (usuarioActivo.rol === "admin") {
      await cargarSucursalesAPI();
      await cargarResumenSucursales();
    }

    await cargarProductosAPI();

    Swal.fire({
      icon: "success",
      title: "Sucursal registrada",
      text: "El usuario fue creado correctamente.",
      timer: 1800,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message
    });
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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datosLogin)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || "Error al iniciar sesión");
    }

    guardarSesion(data);
    formLogin.reset();
    mostrarApp();

    if (usuarioActivo.rol === "admin") {
      await cargarSucursalesAPI();
      await cargarResumenSucursales();
    }

    await cargarProductosAPI();

    Swal.fire({
      icon: "success",
      title: "Bienvenido",
      text: `Ingresaste como ${data.nombre}`,
      timer: 1600,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message
    });
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
  sucursales = [];
  sucursalSeleccionada = "";

  localStorage.removeItem("tokenStockAlert");
  localStorage.removeItem("usuarioStockAlert");

  const selectorAdmin = document.querySelector("#selectorSucursalAdmin");

  if (selectorAdmin) {
    selectorAdmin.remove();
  }

  if (resumenSucursales) {
    resumenSucursales.innerHTML = "";
  }

  renderizarProductos([]);
  actualizarResumen([]);
  mostrarAuth();

  Swal.fire({
    icon: "success",
    title: "Sesión cerrada",
    timer: 1200,
    showConfirmButton: false
  });
}

async function cargarProductosAPI() {
  try {
    let url = `${API_URL}/api/productos`;

    if (usuarioActivo?.rol === "admin" && sucursalSeleccionada) {
      url += `?sucursal=${sucursalSeleccionada}`;
    }

    const respuesta = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || "Error al cargar productos");
    }

    productos = data.map(normalizarProducto);

    renderizarProductos(productos);
    actualizarResumen(productos);
    mostrarAlertasVencimiento();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      text: "No se pudieron cargar los productos de la sucursal."
    });
  }
}

function normalizarProducto(producto) {
  return {
    ...producto,
    id: producto._id || producto.id,
    vencimiento: producto.vencimiento?.split("T")[0] || producto.vencimiento
  };
}

function obtenerNombreSucursalProducto(producto) {
  if (producto.sucursal && typeof producto.sucursal === "object") {
    return producto.sucursal.nombre || "Sin sucursal";
  }

  const sucursalEncontrada = sucursales.find(
    (sucursal) => sucursal._id === producto.sucursal
  );

  return sucursalEncontrada?.nombre || "";
}

function renderizarProductos(listaProductos) {
  contenedorProductos.innerHTML = "";

  if (listaProductos.length === 0) {
    contenedorProductos.innerHTML = `
      <p class="mensaje-vacio">No hay productos para mostrar.</p>
    `;
    return;
  }

  listaProductos.forEach((producto) => {
    const estado = obtenerEstadoProducto(producto.vencimiento);
    const estadoStock = obtenerEstadoStock(producto.stock);
    const nombreSucursalProducto = obtenerNombreSucursalProducto(producto);

    const card = document.createElement("article");
    card.classList.add("card-producto", estado.clase, estadoStock.clase);

    card.innerHTML = `
      <h3>${producto.nombre}</h3>
      ${
        usuarioActivo?.rol === "admin"
          ? `<p><strong>Sucursal:</strong> ${nombreSucursalProducto}</p>`
          : ""
      }
      <p><strong>Categoría:</strong> ${producto.categoria}</p>
      <p><strong>Stock:</strong> ${producto.stock}</p>
      <p><strong>Precio:</strong> $${producto.precio}</p>
      <p><strong>EAN:</strong> ${producto.codigoBarras || "Sin EAN"}</p>
      <p><strong>Vencimiento:</strong> ${formatearFecha(producto.vencimiento)}</p>

      <span class="estado ${estado.clase}">${estado.texto}</span>
      <span class="estado-stock ${estadoStock.clase}">${estadoStock.texto}</span>

      <div class="botones">
        <button class="btn-editar" data-id="${producto.id}">Editar</button>
        <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
      </div>
    `;

    contenedorProductos.appendChild(card);
  });
}

function obtenerEstadoProducto(fechaVencimiento) {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diferenciaTiempo = vencimiento - hoy;
  const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));

  if (diferenciaDias < 0) {
    return {
      texto: "Vencido",
      clase: "vencido"
    };
  }

  if (diferenciaDias <= 7) {
    return {
      texto: "Por vencer",
      clase: "por-vencer"
    };
  }

  return {
    texto: "En buen estado",
    clase: "ok"
  };
}

function obtenerEstadoStock(stock) {
  if (stock === 0) {
    return {
      texto: "Agotado",
      clase: "agotado"
    };
  }

  if (stock <= 5) {
    return {
      texto: "Stock crítico",
      clase: "stock-critico"
    };
  }

  if (stock <= 10) {
    return {
      texto: "Stock bajo",
      clase: "stock-bajo"
    };
  }

  return {
    texto: "Stock normal",
    clase: "stock-normal"
  };
}

function formatearFecha(fecha) {
  const fechaNueva = new Date(fecha);

  return fechaNueva.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

formProducto.addEventListener("submit", agregarProducto);

async function agregarProducto(e) {
  e.preventDefault();

  const nombre = document.querySelector("#nombre").value.trim();
  const categoria = document.querySelector("#categoria").value;
  const stock = Number(document.querySelector("#stock").value);
  const precio = Number(document.querySelector("#precio").value);
  const vencimiento = document.querySelector("#vencimiento").value;
  const codigoBarras = codigoBarrasInput.value.trim();

  if (!nombre || !categoria || stock < 0 || precio <= 0 || !vencimiento) {
    Swal.fire({
      icon: "warning",
      title: "Datos incompletos",
      text: "Completá todos los campos correctamente."
    });

    return;
  }

  const nuevoProducto = {
    nombre,
    categoria,
    stock,
    precio,
    vencimiento,
    codigoBarras
  };

  if (usuarioActivo?.rol === "admin" && sucursalSeleccionada) {
    nuevoProducto.sucursal = sucursalSeleccionada;
  }

  try {
    const respuesta = await fetch(`${API_URL}/api/productos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(nuevoProducto)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || "Error al agregar producto");
    }

    productos.push(normalizarProducto(data));
    aplicarFiltros();

    if (usuarioActivo?.rol === "admin") {
      await cargarResumenSucursales();
    }

    formProducto.reset();

    Swal.fire({
      icon: "success",
      title: "Producto agregado",
      text: "El producto fue guardado en la sucursal.",
      timer: 1800,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("ERROR PRODUCTO:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message
    });
  }
}

contenedorProductos.addEventListener("click", manejarBotonesProductos);

function manejarBotonesProductos(e) {
  const idProducto = e.target.dataset.id;

  if (e.target.classList.contains("btn-eliminar")) {
    eliminarProducto(idProducto);
  }

  if (e.target.classList.contains("btn-editar")) {
    editarProducto(idProducto);
  }
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
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(data.mensaje || "Error al eliminar producto");
        }

        productos = productos.filter((producto) => producto.id !== idProducto);
        aplicarFiltros();

        if (usuarioActivo?.rol === "admin") {
          await cargarResumenSucursales();
        }

        Swal.fire({
          icon: "success",
          title: "Eliminado",
          text: "El producto fue eliminado.",
          timer: 1600,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el producto."
        });
      }
    }
  });
}

function editarProducto(idProducto) {
  const productoEncontrado = productos.find(
    (producto) => producto.id === idProducto
  );

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
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar cambios",
    cancelButtonText: "Cancelar",

    didOpen: () => {
      document.querySelector("#editarCategoria").value =
        productoEncontrado.categoria;
    },

    preConfirm: () => {
      const nombre = document.querySelector("#editarNombre").value.trim();
      const categoria = document.querySelector("#editarCategoria").value;
      const stock = Number(document.querySelector("#editarStock").value);
      const precio = Number(document.querySelector("#editarPrecio").value);
      const vencimiento = document.querySelector("#editarVencimiento").value;
      const codigoBarras = document
        .querySelector("#editarCodigoBarras")
        .value.trim();

      if (!nombre || !categoria || stock < 0 || precio <= 0 || !vencimiento) {
        Swal.showValidationMessage("Completá todos los campos correctamente");
        return false;
      }

      return {
        nombre,
        categoria,
        stock,
        precio,
        vencimiento,
        codigoBarras
      };
    }
  }).then(async (resultado) => {
    if (resultado.isConfirmed) {
      try {
        const respuesta = await fetch(`${API_URL}/api/productos/${idProducto}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(resultado.value)
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(data.mensaje || "Error al actualizar producto");
        }

        productos = productos.map((producto) =>
          producto.id === idProducto ? normalizarProducto(data) : producto
        );

        aplicarFiltros();

        if (usuarioActivo?.rol === "admin") {
          await cargarResumenSucursales();
        }

        Swal.fire({
          icon: "success",
          title: "Producto actualizado",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar el producto."
        });
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
  const textoBusqueda = buscador.value.toLowerCase();
  const categoriaSeleccionada = filtroCategoria.value;
  const estadoSeleccionado = filtroEstado.value;
  const ordenSeleccionado = ordenar.value;

  let productosFiltrados = productos.filter((producto) => {
    const coincideNombre = producto.nombre.toLowerCase().includes(textoBusqueda);

    const coincideCategoria =
      categoriaSeleccionada === "todas" ||
      producto.categoria === categoriaSeleccionada;

    const estadoProducto = obtenerEstadoProducto(producto.vencimiento).clase;

    const coincideEstado =
      estadoSeleccionado === "todos" || estadoSeleccionado === estadoProducto;

    return coincideNombre && coincideCategoria && coincideEstado;
  });

  if (ordenSeleccionado === "nombre") {
    productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  if (ordenSeleccionado === "stock") {
    productosFiltrados.sort((a, b) => a.stock - b.stock);
  }

  if (ordenSeleccionado === "vencimiento") {
    productosFiltrados.sort(
      (a, b) => new Date(a.vencimiento) - new Date(b.vencimiento)
    );
  }

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

  Swal.fire({
    icon: "success",
    title: "Búsqueda limpia",
    timer: 1200,
    showConfirmButton: false
  });
}

function actualizarResumen(listaProductos) {
  const cantidadTotal = listaProductos.length;

  const cantidadPorVencer = listaProductos.filter((producto) => {
    return obtenerEstadoProducto(producto.vencimiento).clase === "por-vencer";
  }).length;

  const cantidadVencidos = listaProductos.filter((producto) => {
    return obtenerEstadoProducto(producto.vencimiento).clase === "vencido";
  }).length;

  const cantidadStockBajo = listaProductos.filter((producto) => {
    return producto.stock > 0 && producto.stock <= 5;
  }).length;

  const cantidadAgotados = listaProductos.filter((producto) => {
    return producto.stock === 0;
  }).length;

  const valorTotalInventario = listaProductos.reduce((total, producto) => {
    return total + producto.stock * producto.precio;
  }, 0);

  totalProductos.textContent = cantidadTotal;
  productosPorVencer.textContent = cantidadPorVencer;
  productosVencidos.textContent = cantidadVencidos;
  productosStockBajo.textContent = cantidadStockBajo;
  productosAgotados.textContent = cantidadAgotados;

  valorInventario.textContent = valorTotalInventario.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  });
}

function mostrarAlertasVencimiento() {
  const productosVencidosLista = productos.filter((producto) => {
    return obtenerEstadoProducto(producto.vencimiento).clase === "vencido";
  });

  const productosPorVencerLista = productos.filter((producto) => {
    return obtenerEstadoProducto(producto.vencimiento).clase === "por-vencer";
  });

  if (
    productosVencidosLista.length === 0 &&
    productosPorVencerLista.length === 0
  ) {
    return;
  }

  let html = "";

  if (productosVencidosLista.length > 0) {
    html += `
      <div style="margin-bottom:20px; text-align:left;">
        <h3 style="color:#d90429;">Productos vencidos (${productosVencidosLista.length})</h3>
        <ul style="padding-left:20px;">
          ${productosVencidosLista
            .map((producto) => `<li>${producto.nombre}</li>`)
            .join("")}
        </ul>
      </div>
    `;
  }

  if (productosPorVencerLista.length > 0) {
    html += `
      <div style="text-align:left;">
        <h3 style="color:#f4a261;">Productos por vencer (${productosPorVencerLista.length})</h3>
        <ul style="padding-left:20px;">
          ${productosPorVencerLista
            .map((producto) => `<li>${producto.nombre}</li>`)
            .join("")}
        </ul>
      </div>
    `;
  }

  Swal.fire({
    icon: "warning",
    title: "Alerta de vencimientos",
    html: html,
    confirmButtonText: "Entendido",
    width: 600
  });
}

function cambiarModoOscuro() {
  document.body.classList.toggle("modo-oscuro");

  const modoOscuroActivo = document.body.classList.contains("modo-oscuro");

  localStorage.setItem("modoOscuro", JSON.stringify(modoOscuroActivo));
}

function aplicarModoGuardado() {
  const modoOscuroActivo = JSON.parse(localStorage.getItem("modoOscuro"));

  if (modoOscuroActivo) {
    document.body.classList.add("modo-oscuro");
  }
}

async function iniciarEscaner() {
  if (escanerActivo) {
    await detenerEscaner();
    return;
  }

  lectorCodigo.classList.remove("oculto");

  html5QrCode = new Html5Qrcode("lectorCodigo");

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 120
        }
      },
      async (codigoDetectado) => {
        codigoBarrasInput.value = codigoDetectado;

        await detenerEscaner();

        Swal.fire({
          icon: "success",
          title: "EAN detectado",
          text: codigoDetectado,
          timer: 1500,
          showConfirmButton: false
        });
      }
    );

    escanerActivo = true;
    btnEscanear.textContent = "Detener escáner";
  } catch (error) {
    lectorCodigo.classList.add("oculto");

    Swal.fire({
      icon: "error",
      title: "Error de cámara",
      text: "No se pudo acceder a la cámara."
    });
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
    Swal.fire({
      icon: "info",
      title: "Sin productos",
      text: "No hay productos para exportar."
    });
    return;
  }

  let contenidoCSV = "Producto,Categoría,Stock,Precio,EAN,Vencimiento,Estado,Estado stock,Sucursal\n";

  productos.forEach((producto) => {
    const nombreSucursalProducto = obtenerNombreSucursalProducto(producto);

    contenidoCSV += `"${producto.nombre}","${producto.categoria}",${producto.stock},${producto.precio},"${producto.codigoBarras || "Sin EAN"}","${formatearFecha(producto.vencimiento)}","${obtenerEstadoProducto(producto.vencimiento).texto}","${obtenerEstadoStock(producto.stock).texto}","${nombreSucursalProducto}"\n`;
  });

  const blob = new Blob([contenidoCSV], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = `stockalert-inventario-${Date.now()}.csv`;
  enlace.click();

  URL.revokeObjectURL(url);

  Swal.fire({
    icon: "success",
    title: "Inventario exportado",
    text: "Se descargó el archivo CSV.",
    timer: 1600,
    showConfirmButton: false
  });
}

function importarExcel() {
  const archivo = inputImportar.files[0];

  if (!archivo) {
    Swal.fire({
      icon: "warning",
      title: "Seleccioná un archivo",
      text: "Primero elegí un archivo CSV para importar."
    });
    return;
  }

  const lector = new FileReader();

  lector.onload = async function (e) {
    const contenido = e.target.result;
    const lineas = contenido.split("\n").filter((linea) => linea.trim() !== "");

    const encabezados = lineas[0].split(",").map((h) =>
      h.trim().replaceAll('"', "").toLowerCase()
    );

    const productosImportados = lineas.slice(1).map((linea) => {
      const valores = linea.split(",").map((v) => v.trim().replaceAll('"', ""));
      const producto = {};

      encabezados.forEach((encabezado, index) => {
        producto[encabezado] = valores[index];
      });

      const productoFinal = {
        nombre: producto.producto || producto.nombre,
        categoria: producto.categoría || producto.categoria,
        stock: Number(producto.stock),
        precio: Number(producto.precio),
        codigoBarras: producto.ean || producto.codigobarras || "",
        vencimiento: convertirFechaImportada(producto.vencimiento)
      };

      if (usuarioActivo?.rol === "admin" && sucursalSeleccionada) {
        productoFinal.sucursal = sucursalSeleccionada;
      }

      return productoFinal;
    });

    const productosValidos = productosImportados.filter((producto) => {
      return (
        producto.nombre &&
        producto.categoria &&
        !Number.isNaN(producto.stock) &&
        !Number.isNaN(producto.precio) &&
        producto.vencimiento
      );
    });

    if (productosValidos.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Archivo inválido",
        text: "No se encontraron productos válidos para importar."
      });
      return;
    }

    try {
      for (const producto of productosValidos) {
        const respuesta = await fetch(`${API_URL}/api/productos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(producto)
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(data.mensaje || "Error al importar producto");
        }

        productos.push(normalizarProducto(data));
      }

      aplicarFiltros();
      actualizarResumen(productos);

      if (usuarioActivo?.rol === "admin") {
        await cargarResumenSucursales();
      }

      inputImportar.value = "";

      Swal.fire({
        icon: "success",
        title: "Importación completa",
        text: `Se importaron ${productosValidos.length} productos.`,
        timer: 1800,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al importar",
        text: error.message
      });
    }
  };

  lector.readAsText(archivo, "UTF-8");
}

function convertirFechaImportada(fecha) {
  if (!fecha) return "";

  if (fecha.includes("-")) {
    return fecha;
  }

  if (fecha.includes("/")) {
    const partes = fecha.split("/");

    if (partes.length === 3) {
      const dia = partes[0].padStart(2, "0");
      const mes = partes[1].padStart(2, "0");
      const anio = partes[2];

      return `${anio}-${mes}-${dia}`;
    }
  }

  return fecha;
}