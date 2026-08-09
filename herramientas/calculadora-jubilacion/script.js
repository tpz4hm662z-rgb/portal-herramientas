const CONFIG = {
    herramienta: {
        url: "https://imoancy.com/herramientas/calculadora-jubilacion/"
    }
};

function calcularJubilacion() {

    let edadActual = Number(document.getElementById("edadActual").value);
    let edadJubilacion = Number(document.getElementById("edadJubilacion").value);
    let ahorroActual = Number(document.getElementById("ahorroActual").value);
    let aportacionMensual = Number(document.getElementById("aportacionMensual").value);
    let rentabilidadAnual = Number(document.getElementById("rentabilidadAnual").value);

    if (
        edadActual <= 0 ||
        edadJubilacion <= edadActual ||
        ahorroActual < 0 ||
        aportacionMensual < 0 ||
        rentabilidadAnual <= 0
    ) {
        document.getElementById("resultado").innerHTML =
            "Por favor, introduce valores válidos.";
        return;
    }

    let anosRestantes = edadJubilacion - edadActual;
    let meses = anosRestantes * 12;

    let interesMensual = (rentabilidadAnual / 100) / 12;

    let capital = ahorroActual;

    for (let i = 0; i < meses; i++) {
        capital = capital * (1 + interesMensual);
        capital += aportacionMensual;
    }

    let totalAportado = ahorroActual + (aportacionMensual * meses);
    let ganancias = capital - totalAportado;
    function calcularEscenario(rentabilidad) {

    let interesMensualEscenario = (rentabilidad / 100) / 12;
    let capitalEscenario = ahorroActual;

    for (let i = 0; i < meses; i++) {
        capitalEscenario = capitalEscenario * (1 + interesMensualEscenario);
        capitalEscenario += aportacionMensual;
    }

    return capitalEscenario;
}

let escenario3 = calcularEscenario(3);
let escenario5 = calcularEscenario(5);
let escenario7 = calcularEscenario(7);

    function formatoEuro(numero) {
        return numero.toLocaleString("es-ES", {
            style: "currency",
            currency: "EUR"
        });
    }

    document.getElementById("resultado").innerHTML = `
        <h3>Estimación de Jubilación</h3>

        <strong>Años restantes:</strong> ${anosRestantes}<br><br>

        <strong>Total aportado:</strong> ${formatoEuro(totalAportado)}<br>
        <strong>Ganancias estimadas:</strong> ${formatoEuro(ganancias)}<br>
        <strong>Capital estimado al jubilarte:</strong> ${formatoEuro(capital)}

        <hr>

<h3>Comparativa de rentabilidad</h3>

<p><strong>Escenario 3%:</strong> ${formatoEuro(escenario3)}</p>
<p><strong>Escenario 5%:</strong> ${formatoEuro(escenario5)}</p>
<p><strong>Escenario 7%:</strong> ${formatoEuro(escenario7)}</p>
    `;
}
function reiniciarFormulario() {

    document.getElementById("edadActual").value = "";
    document.getElementById("edadJubilacion").value = "";
    document.getElementById("ahorroActual").value = "";
    document.getElementById("aportacionMensual").value = "";
    document.getElementById("rentabilidadAnual").value = "";

    document.getElementById("resultado").innerHTML = "";
}
