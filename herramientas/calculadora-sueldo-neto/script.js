const CONFIG = {
    herramienta: {
        url: "https://imoancy.com/herramientas/calculadora-sueldo-neto/"
    }
};

function calcularSueldo() {

    let salarioBruto = Number(document.getElementById("salarioBruto").value);
    let pagas = Number(document.getElementById("pagas").value);

    if (salarioBruto <= 0 || pagas <= 0) {
        document.getElementById("resultado").innerHTML =
            "Por favor, introduce valores válidos.";
        return;
    }

    let seguridadSocial = salarioBruto * 0.0635;

    let irpfPorcentaje = 0;

    if (salarioBruto < 15000) {
        irpfPorcentaje = 0.08;
    } else if (salarioBruto < 25000) {
        irpfPorcentaje = 0.12;
    } else if (salarioBruto < 35000) {
        irpfPorcentaje = 0.15;
    } else if (salarioBruto < 50000) {
        irpfPorcentaje = 0.18;
    } else {
        irpfPorcentaje = 0.22;
    }

    let irpf = salarioBruto * irpfPorcentaje;

    let salarioNetoAnual = salarioBruto - seguridadSocial - irpf;
    let salarioNetoMensual = salarioNetoAnual / 12;
    let salarioNetoPorPaga = salarioNetoAnual / pagas;
    let retencionTotal = seguridadSocial + irpf;

    function formatoEuro(numero) {
        return numero.toLocaleString("es-ES", {
            style: "currency",
            currency: "EUR"
        });
    }

    document.getElementById("resultado").innerHTML = `
        <h3>Resultado estimado</h3>

        <strong>Salario bruto anual:</strong> ${formatoEuro(salarioBruto)}<br>
        <strong>Seguridad Social aproximada:</strong> ${formatoEuro(seguridadSocial)}<br>
        <strong>IRPF aproximado:</strong> ${formatoEuro(irpf)}<br><br>

        <strong>Salario neto anual aproximado:</strong> ${formatoEuro(salarioNetoAnual)}<br>
        <strong>Neto mensual aproximado:</strong> ${formatoEuro(salarioNetoMensual)}<br>
        <strong>Neto por paga:</strong> ${formatoEuro(salarioNetoPorPaga)}<br>
        <strong>Retenciones totales aproximadas:</strong> ${formatoEuro(retencionTotal)}
    `;
}

function reiniciarFormulario() {

    document.getElementById("salarioBruto").value = "";
    document.getElementById("pagas").value = "";
    document.getElementById("resultado").innerHTML = "";
}
