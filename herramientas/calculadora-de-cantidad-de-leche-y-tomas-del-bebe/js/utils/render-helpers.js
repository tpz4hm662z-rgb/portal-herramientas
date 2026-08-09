/** Primitivas seguras para renderizado mediante textContent. */
export function crearElemento(etiqueta, texto = "", clase = "") {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  elemento.textContent = texto;
  return elemento;
}
export function vaciar(elemento) { if (elemento) elemento.replaceChildren(); }
export function mostrar(elemento, visible = true) {
  if (!elemento) return;
  elemento.hidden = !visible;
  elemento.classList.toggle("oculto", !visible);
  elemento.setAttribute("aria-hidden", String(!visible));
}
