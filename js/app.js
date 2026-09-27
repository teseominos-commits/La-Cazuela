(function () {
  "use strict";

  const NOMBRES_ALERGENOS = {
    gluten: "gluten",
    lacteos: "lácteos",
    huevo: "huevo",
    pescado: "pescado",
    frutos_secos: "frutos secos",
    sesamo: "sésamo",
    sulfitos: "sulfitos",
    marisco: "marisco",
    soja: "soja"
  };

  const navCategorias = document.getElementById("nav-categorias");
  const contenido = document.getElementById("contenido-carta");
  const pieAviso = document.getElementById("pie-aviso");

  function formatearPrecio(precio) {
    return precio.toFixed(2).replace(".", ",") + " €";
  }

  function formatearAlergenos(lista) {
    if (!lista || lista.length === 0) return "";
    const nombres = lista.map((clave) => NOMBRES_ALERGENOS[clave] || clave);
    return "Contiene: " + nombres.join(", ");
  }

  function crearElementoPlato(plato) {
    const articulo = document.createElement("article");
    articulo.className = "plato";

    const cabecera = document.createElement("div");
    cabecera.className = "plato__cabecera";

    const nombre = document.createElement("h3");
    nombre.className = "plato__nombre";
    nombre.textContent = plato.nombre;

    const precio = document.createElement("span");
    precio.className = "plato__precio";
    precio.textContent = formatearPrecio(plato.precio);

    cabecera.appendChild(nombre);
    cabecera.appendChild(precio);
    articulo.appendChild(cabecera);

    if (plato.descripcion) {
      const descripcion = document.createElement("p");
      descripcion.className = "plato__descripcion";
      descripcion.textContent = plato.descripcion;
      articulo.appendChild(descripcion);
    }

    const textoAlergenos = formatearAlergenos(plato.alergenos);
    if (textoAlergenos) {
      const alergenos = document.createElement("p");
      alergenos.className = "plato__alergenos";
      alergenos.textContent = textoAlergenos;
      articulo.appendChild(alergenos);
    }

    return articulo;
  }

  function crearSeccion(categoria) {
    const seccion = document.createElement("section");
    seccion.className = "seccion";
    seccion.id = "seccion-" + categoria.id;

    const titulo = document.createElement("h2");
    titulo.className = "seccion__titulo";
    titulo.textContent = categoria.nombre;
    seccion.appendChild(titulo);

    categoria.platos.forEach((plato) => {
      seccion.appendChild(crearElementoPlato(plato));
    });

    return seccion;
  }

  function crearBotonCategoria(categoria, alHacerClic) {
    const boton = document.createElement("button");
    boton.className = "categorias__boton";
    boton.type = "button";
    boton.textContent = categoria.nombre;
    boton.dataset.categoria = categoria.id;
    boton.addEventListener("click", () => alHacerClic(categoria.id));
    return boton;
  }

  function marcarBotonActivo(idCategoria) {
    const botones = navCategorias.querySelectorAll(".categorias__boton");
    botones.forEach((boton) => {
      boton.classList.toggle("activo", boton.dataset.categoria === idCategoria);
    });
  }

  function irACategoria(idCategoria) {
    const seccion = document.getElementById("seccion-" + idCategoria);
    if (!seccion) return;
    const offset = navCategorias.offsetHeight + 10;
    const posicion = seccion.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: posicion, behavior: "smooth" });
    marcarBotonActivo(idCategoria);
  }

  function renderizarCarta(datos) {
    document.title = datos.restaurante.nombre + " — Carta digital";

    const nombreCabecera = document.querySelector(".cabecera__nombre");
    const esloganCabecera = document.querySelector(".cabecera__eslogan");
    if (nombreCabecera) nombreCabecera.textContent = datos.restaurante.nombre;
    if (esloganCabecera) esloganCabecera.textContent = datos.restaurante.eslogan;
    if (pieAviso) pieAviso.textContent = datos.restaurante.aviso || "";

    navCategorias.innerHTML = "";
    datos.categorias.forEach((categoria) => {
      navCategorias.appendChild(crearBotonCategoria(categoria, irACategoria));
    });

    contenido.innerHTML = "";
    datos.categorias.forEach((categoria) => {
      contenido.appendChild(crearSeccion(categoria));
    });

    if (datos.categorias.length > 0) {
      marcarBotonActivo(datos.categorias[0].id);
    }
  }

  function mostrarError() {
    contenido.innerHTML =
      '<p class="carta__cargando">No se ha podido cargar la carta. Inténtalo de nuevo más tarde.</p>';
  }

  fetch("data/menu.json")
    .then((respuesta) => {
      if (!respuesta.ok) throw new Error("No se pudo leer el menú");
      return respuesta.json();
    })
    .then(renderizarCarta)
    .catch(mostrarError);
})();
