let graficoInteres = null;

function calcularInteresCompuesto() {
    let capitalInicial = Number(document.getElementById("capitalInicial").value);
    let aportacionMensual = Number(document.getElementById("aportacionMensual").value);
    let rentabilidadAnual = Number(document.getElementById("rentabilidadAnual").value);
    let anos = Number(document.getElementById("anos").value);

    if (capitalInicial < 0 || aportacionMensual < 0 || rentabilidadAnual < 0 || anos <= 0) {
        document.getElementById("resultado").innerHTML =
            "Por favor, introduce valores válidos.";
        return;
    }

    let meses = anos * 12;
    let rentabilidadMensual = rentabilidadAnual / 100 / 12;
    let capitalFinal = capitalInicial;
    let datosGrafico = [];
    let etiquetasGrafico = [];

    for (let i = 1; i <= meses; i++) {
        capitalFinal = capitalFinal * (1 + rentabilidadMensual);
        capitalFinal = capitalFinal + aportacionMensual;

        if (i % 12 === 0) {
            etiquetasGrafico.push("Año " + (i / 12));
            datosGrafico.push(capitalFinal.toFixed(2));
        }
    }

    let capitalAportado = capitalInicial + (aportacionMensual * meses);
    let beneficio = capitalFinal - capitalAportado;

    document.getElementById("resultado").innerHTML = `
        <div class="tarjeta"><strong>Capital aportado:</strong> ${capitalAportado.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</div>
        <div class="tarjeta"><strong>Beneficio generado:</strong> ${beneficio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</div>
        <div class="tarjeta"><strong>Capital final estimado:</strong> ${capitalFinal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</div>
    `;

    mostrarGrafico(etiquetasGrafico, datosGrafico);
}

function mostrarGrafico(etiquetas, datos) {
    let ctx = document.getElementById("grafico").getContext("2d");

    if (graficoInteres !== null) {
        graficoInteres.destroy();
    }

    graficoInteres = new Chart(ctx, {
        type: "line",
        data: {
            labels: etiquetas,
            datasets: [{
                label: "Capital estimado",
                data: datos,
                borderWidth: 3,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

function reiniciar() {
    document.getElementById("capitalInicial").value = "";
    document.getElementById("aportacionMensual").value = "";
    document.getElementById("rentabilidadAnual").value = "";
    document.getElementById("anos").value = "";
    document.getElementById("resultado").innerHTML = "";

    if (graficoInteres !== null) {
        graficoInteres.destroy();
        graficoInteres = null;
    }
}
