function calcularInflacion() {

    let cantidadActual = Number(document.getElementById("cantidadActual").value);
    let inflacionAnual = Number(document.getElementById("inflacionAnual").value);
    let anos = Number(document.getElementById("anos").value);

    if (
        cantidadActual <= 0 ||
        inflacionAnual <= 0 ||
        anos <= 0
    ) {
        document.getElementById("resultado").innerHTML =
            "Por favor, introduce valores válidos.";
        return;
    }

    let valorReal = cantidadActual / Math.pow(1 + (inflacionAnual / 100), anos);

    let perdidaPoderAdquisitivo = cantidadActual - valorReal;

    document.getElementById("resultado").innerHTML = `
        <strong>Cantidad actual:</strong> ${formatearEuros(cantidadActual)}<br><br>

        <strong>Valor real estimado dentro de ${anos} años:</strong> ${formatearEuros(valorReal)}<br><br>

        <strong>Pérdida de poder adquisitivo:</strong> ${formatearEuros(perdidaPoderAdquisitivo)}<br><br>

        <em>
        Resultado orientativo basado en una inflación constante.
        </em>
    `;
}

function formatearEuros(cantidad) {
    return cantidad.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR"
    });
}

function reiniciarCalculadora() {
    document.getElementById("cantidadActual").value = "";
    document.getElementById("inflacionAnual").value = "";
    document.getElementById("anos").value = "";
    document.getElementById("resultado").innerHTML = "";
}