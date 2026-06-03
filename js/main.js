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

let productos = [];

document.addEventListener("DOMContentLoaded", iniciarApp);

async function iniciarApp() {
  aplicarModoGuardado();

  productos = obtenerProductosStorage();

  if (productos.length === 0) {
    await cargarProductosJSON();
  }

  renderizarProductos(productos);
  actualizarResumen(productos);
  mostrarAlertasVencimiento();
}

async function cargarProductosJSON() {
  try {
    const respuesta = await fetch("./data/productos.json");
    const data = await respuesta.json();

    productos = data;
    guardarProductosStorage();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los productos iniciales"
    });
  }
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

function agregarProducto(e) {
  e.preventDefault();

  const nombre = document.querySelector("#nombre").value.trim();
  const categoria = document.querySelector("#categoria").value;
  const stock = Number(document.querySelector("#stock").value);
  const precio = Number(document.querySelector("#precio").value);
  const vencimiento = document.querySelector("#vencimiento").value;

  if (!nombre || !categoria || stock <= 0 || precio <= 0 || !vencimiento) {
    Swal.fire({
      icon: "warning",
      title: "Datos incompletos",
      text: "Completá todos los campos correctamente."
    });

    return;
  }

  const nuevoProducto = {
    id: Date.now(),
    nombre,
    categoria,
    stock,
    precio,
    vencimiento
  };

  productos.push(nuevoProducto);
  guardarProductosStorage();
  aplicarFiltros();
  formProducto.reset();

  Swal.fire({
    icon: "success",
    title: "Producto agregado",
    text: "El producto fue cargado correctamente.",
    timer: 1800,
    showConfirmButton: false
  });
}

contenedorProductos.addEventListener("click", manejarBotonesProductos);

function manejarBotonesProductos(e) {
  const idProducto = Number(e.target.dataset.id);

  if (e.target.classList.contains("btn-eliminar")) {
    eliminarProducto(idProducto);
  }

  if (e.target.classList.contains("btn-editar")) {
    editarProducto(idProducto);
  }
}

function eliminarProducto(idProducto) {
  Swal.fire({
    title: "¿Eliminar producto?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then((resultado) => {
    if (resultado.isConfirmed) {
      productos = productos.filter((producto) => producto.id !== idProducto);

      guardarProductosStorage();
      aplicarFiltros();

      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El producto fue eliminado.",
        timer: 1600,
        showConfirmButton: false
      });
    }
  });
}

function editarProducto(idProducto) {
  const productoEncontrado = productos.find(
    (producto) => producto.id === idProducto
  );

  Swal.fire({
    title: "Editar producto",
    html: `
      <input
        id="editarNombre"
        class="swal2-input"
        placeholder="Nombre del producto"
        value="${productoEncontrado.nombre}"
      >

      <select id="editarCategoria" class="swal2-input">
        <option value="Lácteos">Lácteos</option>
        <option value="Bebidas">Bebidas</option>
        <option value="Almacén">Almacén</option>
        <option value="Limpieza">Limpieza</option>
        <option value="Congelados">Congelados</option>
      </select>

      <input
        id="editarStock"
        type="number"
        class="swal2-input"
        placeholder="Stock"
        value="${productoEncontrado.stock}"
      >

      <input
        id="editarPrecio"
        type="number"
        class="swal2-input"
        placeholder="Precio"
        value="${productoEncontrado.precio}"
      >

      <input
        id="editarVencimiento"
        type="date"
        class="swal2-input"
        value="${productoEncontrado.vencimiento}"
      >
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

      if (!nombre || !categoria || stock <= 0 || precio <= 0 || !vencimiento) {
        Swal.showValidationMessage("Completá todos los campos correctamente");
        return false;
      }

      return {
        nombre,
        categoria,
        stock,
        precio,
        vencimiento
      };
    }
  }).then((resultado) => {
    if (resultado.isConfirmed) {
      productoEncontrado.nombre = resultado.value.nombre;
      productoEncontrado.categoria = resultado.value.categoria;
      productoEncontrado.stock = resultado.value.stock;
      productoEncontrado.precio = resultado.value.precio;
      productoEncontrado.vencimiento = resultado.value.vencimiento;

      guardarProductosStorage();
      aplicarFiltros();

      Swal.fire({
        icon: "success",
        title: "Producto actualizado",
        timer: 1500,
        showConfirmButton: false
      });
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
        <h3 style="color:#d90429;">
          Productos vencidos (${productosVencidosLista.length})
        </h3>

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
        <h3 style="color:#f4a261;">
          Productos por vencer (${productosPorVencerLista.length})
        </h3>

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

function guardarProductosStorage() {
  localStorage.setItem("productos", JSON.stringify(productos));
}

function obtenerProductosStorage() {
  const productosStorage = localStorage.getItem("productos");

  return productosStorage ? JSON.parse(productosStorage) : [];
}