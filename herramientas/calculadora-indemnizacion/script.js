function calcularIndemnizacion() {

    let salario = Number(document.getElementById("salario").value);
    let fechaInicio = new Date(document.getElementById("fechaInicio").value);
    let fechaFin = new Date(document.getElementById("fechaFin").value);
    let tipoDespido = document.getElementById("tipoDespido").value;

    if (salario <= 0) {
        document.getElementById("resultado").innerHTML =
            "Introduce un salario válido.";
        return;
    }

    if (fechaInicio.getFullYear() < 1950 || fechaFin.getFullYear() < 1950) {
        document.getElementById("resultado").innerHTML =
            "Por favor, introduce fechas reales.";
        return;
    }

    if (fechaFin <= fechaInicio) {
        document.getElementById("resultado").innerHTML =
            "La fecha de fin debe ser posterior a la fecha de inicio.";
        return;
    }

    let diferenciaTiempo = fechaFin - fechaInicio;
    let añosTrabajados = diferenciaTiempo / (1000 * 60 * 60 * 24 * 365);

    let diasPorAño = 0;

    if (tipoDespido === "objetivo") {
        diasPorAño = 20;
    } else {
        diasPorAño = 33;
    }

    let salarioDiario = (salario * 12) / 365;

    let indemnizacion =
        salarioDiario * diasPorAño * añosTrabajados;

    document.getElementById("resultado").innerHTML =
        "Años trabajados: " + añosTrabajados.toFixed(2) + "<br>" +
        "Días por año: " + diasPorAño + "<br>" +
        "Salario diario: " + salarioDiario.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " €<br>" +
        "Indemnización estimada: " + indemnizacion.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " €";
}

function reiniciar() {
    document.getElementById("salario").value = "";
    document.getElementById("fechaInicio").value = "";
    document.getElementById("fechaFin").value = "";
    document.getElementById("tipoDespido").value = "improcedente";
    document.getElementById("resultado").innerHTML = "";
}