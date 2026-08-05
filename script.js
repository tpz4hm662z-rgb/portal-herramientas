function normalizarTexto(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function buscarHerramientas() {
    const texto = normalizarTexto(document.getElementById("buscador").value.trim());
    const tarjetas = document.querySelectorAll(".tarjeta");
    let resultados = 0;

    tarjetas.forEach(function(tarjeta) {
        const contenido = normalizarTexto(
            tarjeta.textContent + " " + (tarjeta.dataset.search || "")
        );

        if (contenido.includes(texto)) {
            tarjeta.style.display = "";
            resultados += 1;
        } else {
            tarjeta.style.display = "none";
        }
    });

    document.getElementById("estado-busqueda").textContent =
        texto ? resultados + (resultados === 1 ? " herramienta encontrada" : " herramientas encontradas") : "";
}

document.getElementById("buscador").addEventListener("input", buscarHerramientas);
