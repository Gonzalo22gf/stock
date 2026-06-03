const API_URL = "https://stockalert-api.onrender.com";

const seccionAuth = document.querySelector("#seccionAuth");
const seccionUsuario = document.querySelector("#seccionUsuario");
const seccionesApp = document.querySelectorAll(".seccion-app");

const formLogin = document.querySelector("#formLogin");
const formRegistro = document.querySelector("#formRegistro");
const btnCerrarSesion = document.querySelector("#btnCerrarSesion");

const nombreUsuario = document.querySelector("#nombreUsuario");
const nombreSucursal = document.querySelector("#nombreSucursal");

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

const codigoBarrasInput = document.querySelector("#codigoBarras");
const btnEscanear = document.querySelector("#btnEscanear");
const lectorCodigo = document.querySelector("#lectorCodigo");

let productos = [];
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
}

function mostrarApp() {
  seccionAuth.classList.add("oculto");
  seccionUsuario.classList.remove("oculto");

  seccionesApp.forEach((seccion) => {
    seccion.classList.remove("oculto");
  });

  nombreUsuario.textContent = usuarioActivo.nombre;
  nombreSucursal.textContent = `Sucursal: ${
    usuarioActivo.sucursal?.nombre || "Sin sucursal"
  }`;
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

  localStorage.removeItem("tokenStockAlert");
  localStorage.removeItem("usuarioStockAlert");

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
    const respuesta = await fetch(`${API_URL}/api/productos`, {
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

    const card = document.createElement("article");
    card.classList.add("card-producto", estado.clase);

    card.innerHTML = `
      <h3>${producto.nombre}</h3>
      <p><strong>Categoría:</strong> ${producto.categoria}</p>
      <p><strong>Stock:</strong> ${producto.stock}</p>
      <p><strong>Precio:</strong> $${producto.precio}</p>
      <p><strong>EAN:</strong> ${producto.codigoBarras || "Sin EAN"}</p>
      <p><strong>Vencimiento:</strong> ${formatearFecha(producto.vencimiento)}</p>
      <span class="estado ${estado.clase}">${estado.texto}</span>

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

  if (!nombre || !categoria || stock <= 0 || precio <= 0 || !vencimiento) {
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
    formProducto.reset();

    Swal.fire({
      icon: "success",
      title: "Producto agregado",
      text: "El producto fue guardado en la sucursal.",
      timer: 1800,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo agregar el producto."
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

      if (!nombre || !categoria || stock <= 0 || precio <= 0 || !vencimiento) {
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

  totalProductos.textContent = cantidadTotal;
  productosPorVencer.textContent = cantidadPorVencer;
  productosVencidos.textContent = cantidadVencidos;
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