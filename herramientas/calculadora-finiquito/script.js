const CONFIG = {
    herramienta: {
        url: "https://imoancy.com/herramientas/calculadora-finiquito/"
    }
};

function calcularFiniquito() {

    let salario = Number(document.getElementById("salario").value);
    let vacaciones = Number(document.getElementById("vacaciones").value);
    let diasTrabajados = Number(document.getElementById("diasTrabajados").value);
    let pagasExtra = Number(document.getElementById("pagasExtra").value);

    if (salario <= 0) {
        document.getElementById("resultado").innerHTML =
            "Introduce un salario válido.";
        return;
    }

    if (vacaciones < 0 || diasTrabajados < 0 || pagasExtra < 0) {
        document.getElementById("resultado").innerHTML =
            "Introduce valores válidos.";
        return;
    }

    let salarioDiario = salario / 30;
    let importeDiasTrabajados = salarioDiario * diasTrabajados;
    let importeVacaciones = salarioDiario * vacaciones;

    let totalFiniquito = importeDiasTrabajados + importeVacaciones + pagasExtra;

    document.getElementById("resultado").innerHTML =
        "Salario diario: " + salarioDiario.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " €<br>" +

        "Días trabajados: " + importeDiasTrabajados.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " €<br>" +

        "Vacaciones pendientes: " + importeVacaciones.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " €<br>" +

        "Pagas extra pendientes: " + pagasExtra.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " €<br><br>" +

        "<strong>Finiquito estimado total: " + totalFiniquito.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " €</strong>";
}
function reiniciar() {
    document.getElementById("salario").value = "";
    document.getElementById("vacaciones").value = "";
    document.getElementById("diasTrabajados").value = "";
    document.getElementById("pagasExtra").value = "";
    document.getElementById("resultado").innerHTML = "";
}
