function calcularFire() {
    let patrimonioActual = Number(document.getElementById("patrimonioActual").value);
    let ahorroMensual = Number(document.getElementById("ahorroMensual").value);
    let gastosMensuales = Number(document.getElementById("gastosMensuales").value);
    let rentabilidadAnual = Number(document.getElementById("rentabilidadAnual").value);

    if (
        patrimonioActual < 0 ||
        ahorroMensual <= 0 ||
        gastosMensuales <= 0 ||
        rentabilidadAnual <= 0
    ) {
        document.getElementById("resultado").innerHTML =
            "Por favor, introduce valores válidos.";
        return;
    }

    let objetivoFire = gastosMensuales * 12 * 25;
    let patrimonio = patrimonioActual;
    let meses = 0;
    let interesMensual = (rentabilidadAnual / 100) / 12;

    while (patrimonio < objetivoFire && meses < 1200) {
        patrimonio += ahorroMensual;
        patrimonio *= (1 + interesMensual);
        meses++;
    }

    let anos = (meses / 12).toFixed(1);

    let fecha = new Date();
    fecha.setMonth(fecha.getMonth() + meses);

    let fechaFire = fecha.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric"
    });

    document.getElementById("resultado").innerHTML = `
        <strong>Objetivo FIRE:</strong> ${formatearEuros(objetivoFire)}<br><br>
        <strong>Patrimonio estimado al alcanzar FIRE:</strong> ${formatearEuros(patrimonio)}<br><br>
        <strong>Tiempo estimado:</strong> ${anos} años<br><br>
        <strong>Fecha aproximada:</strong> ${fechaFire}<br><br>
        <em>Resultado orientativo basado en la regla del 4% y una rentabilidad constante. Los resultados reales pueden variar.</em>
    `;
}

function formatearEuros(cantidad) {
    return cantidad.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR"
    });
}

function reiniciarCalculadora() {
    document.getElementById("patrimonioActual").value = "";
    document.getElementById("ahorroMensual").value = "";
    document.getElementById("gastosMensuales").value = "";
    document.getElementById("rentabilidadAnual").value = "";
    document.getElementById("resultado").innerHTML = "";
}
