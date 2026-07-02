function buscarHerramientas() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const tarjetas = document.querySelectorAll(".tarjeta");

    tarjetas.forEach(function(tarjeta) {
        const contenido = tarjeta.textContent.toLowerCase();

        if (contenido.includes(texto)) {
            tarjeta.style.display = "";
        } else {
            tarjeta.style.display = "none";
        }
    });
}