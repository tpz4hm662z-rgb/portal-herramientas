let grafico = null;

function calcularAhorro() {

    let ahorro = Number(document.getElementById("ahorroMensual").value);

    if (ahorro <= 0) {
        document.getElementById("resultado").innerHTML =
            "Por favor, introduce una cantidad mayor que 0.";
        return;
    }

    let porcentaje = Number(document.getElementById("interesAnual").value);

    let interesAnual = porcentaje / 100;
    let interesMensual = interesAnual / 12;

    let unAno = calcularInteresCompuesto(ahorro, interesMensual, 12);
    let cincoAnos = calcularInteresCompuesto(ahorro, interesMensual, 60);
    let diezAnos = calcularInteresCompuesto(ahorro, interesMensual, 120);
    let veinteAnos = calcularInteresCompuesto(ahorro, interesMensual, 240);
    let treintaAnos = calcularInteresCompuesto(ahorro, interesMensual, 360);

    let aportado1 = ahorro * 12;
    let aportado5 = ahorro * 60;
    let aportado10 = ahorro * 120;
    let aportado20 = ahorro * 240;
    let aportado30 = ahorro * 360;

    let beneficio1 = unAno - aportado1;
    let beneficio5 = cincoAnos - aportado5;
    let beneficio10 = diezAnos - aportado10;
    let beneficio20 = veinteAnos - aportado20;
    let beneficio30 = treintaAnos - aportado30;

    document.getElementById("resultado").innerHTML =
        "<div class='resumen-final'>" +
            "<p>Capital final estimado a 30 años</p>" +
            "<h2>" + formatoEuro(treintaAnos) + "</h2>" +
        "</div>" +
        "<h2>Resultado con " + porcentaje + "% anual</h2>" +
        crearTarjeta("1 Año", aportado1, beneficio1, unAno) +
        crearTarjeta("5 Años", aportado5, beneficio5, cincoAnos) +
        crearTarjeta("10 Años", aportado10, beneficio10, diezAnos) +
        crearTarjeta("20 Años", aportado20, beneficio20, veinteAnos) +
        crearTarjeta("30 Años", aportado30, beneficio30, treintaAnos);

    crearGrafico([unAno, cincoAnos, diezAnos, veinteAnos, treintaAnos]);

    document.getElementById("btnPDF").style.display = "block";
}

function calcularInteresCompuesto(ahorroMensual, interesMensual, meses) {
    let total = 0;

    for (let i = 1; i <= meses; i++) {
        total = total + ahorroMensual;
        total = total * (1 + interesMensual);
    }

    return total;
}

function crearTarjeta(titulo, aportado, beneficio, total) {
    return `
        <div class="tarjeta">
            <h3>${titulo}</h3>
            <p>Aportado: <strong>${formatoEuro(aportado)}</strong></p>
            <p>Beneficio: <strong class="beneficio">${formatoEuro(beneficio)}</strong></p>
            <p>Total: <strong class="total">${formatoEuro(total)}</strong></p>
        </div>
    `;
}

function formatoEuro(numero) {

    let moneda = document.getElementById("moneda").value;

    return numero.toLocaleString("es-ES", {
        style: "currency",
        currency: moneda
    });
}

function crearGrafico(datos) {
    let canvas = document.getElementById("graficoAhorro");

    if (grafico !== null) {
        grafico.destroy();
    }

    grafico = new Chart(canvas, {
        type: "line",
        data: {
            labels: ["1 año", "5 años", "10 años", "20 años", "30 años"],
            datasets: [{
                label: "Crecimiento del ahorro",
                data: datos,
                borderWidth: 3,
                tension: 0.3
            }]
        }
    });
}

function reiniciarCalculadora() {

    document.getElementById("ahorroMensual").value = "";
    document.getElementById("interesAnual").value = "7";
    document.getElementById("resultado").innerHTML = "";
    document.getElementById("btnPDF").style.display = "none";

    if (grafico !== null) {
        grafico.destroy();
        grafico = null;
    }

}
document.getElementById("btnPDF").addEventListener("click", function () {
    generarPDF();
});

function generarPDF() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let ahorro = Number(document.getElementById("ahorroMensual").value);
    let interes = Number(document.getElementById("interesAnual").value);
    let moneda = document.getElementById("moneda").value;

    let fecha = new Date().toLocaleDateString("es-ES");

    let interesMensual = (interes / 100) / 12;

    let unAno = calcularInteresCompuesto(ahorro, interesMensual, 12);
    let cincoAnos = calcularInteresCompuesto(ahorro, interesMensual, 60);
    let diezAnos = calcularInteresCompuesto(ahorro, interesMensual, 120);
    let veinteAnos = calcularInteresCompuesto(ahorro, interesMensual, 240);
    let treintaAnos = calcularInteresCompuesto(ahorro, interesMensual, 360);

    doc.setFontSize(20);
    doc.text("Calculadora de Ahorro", 20, 20);

    doc.setFontSize(11);
    doc.text("Informe generado el: " + fecha, 20, 30);

    doc.line(20, 35, 190, 35);

    doc.setFontSize(14);
    doc.text("Datos introducidos", 20, 50);

    doc.setFontSize(12);
    doc.text("Ahorro mensual: " + formatoEuro(ahorro), 20, 65);
    doc.text("Rentabilidad anual estimada: " + interes + "%", 20, 75);
    doc.text("Moneda seleccionada: " + moneda, 20, 85);

    doc.setFontSize(14);
    doc.text("Resultados estimados", 20, 105);

    doc.setFontSize(12);
    doc.text("1 año: " + formatoEuro(unAno), 20, 120);
    doc.text("5 años: " + formatoEuro(cincoAnos), 20, 130);
    doc.text("10 años: " + formatoEuro(diezAnos), 20, 140);
    doc.text("20 años: " + formatoEuro(veinteAnos), 20, 150);
    doc.text("30 años: " + formatoEuro(treintaAnos), 20, 160);

    doc.line(20, 175, 190, 175);

    doc.setFontSize(14);
    doc.text("Capital final estimado a 30 años", 20, 190);

    doc.setFontSize(22);
    doc.text(formatoEuro(treintaAnos), 20, 205);

    doc.setFontSize(10);
    doc.text("Este informe es una estimación basada en aportaciones periódicas y una rentabilidad constante.", 20, 270);
    let canvas = document.getElementById("graficoAhorro");

let imagenGrafico = canvas.toDataURL("image/png");

doc.addPage();

doc.setFontSize(18);
doc.text("Grafico de crecimiento", 20, 20);

doc.addImage(imagenGrafico, "PNG", 15, 35, 180, 90);
    doc.save("informe-ahorro.pdf");
}