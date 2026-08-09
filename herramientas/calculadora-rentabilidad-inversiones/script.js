function calcularRentabilidad() {
    let capitalInicial = Number(document.getElementById("capitalInicial").value);
    let aportacionMensual = Number(document.getElementById("aportacionMensual").value);
    let rentabilidadAnual = Number(document.getElementById("rentabilidadAnual").value);
    let anos = Number(document.getElementById("anos").value);

    if (
        capitalInicial < 0 ||
        aportacionMensual < 0 ||
        rentabilidadAnual <= 0 ||
        anos <= 0
    ) {
        document.getElementById("resultado").innerHTML =
            "Por favor, introduce valores válidos.";
        return;
    }

    let interesMensual = (rentabilidadAnual / 100) / 12;
    let meses = anos * 12;
    let capitalFinal = capitalInicial;

    for (let i = 0; i < meses; i++) {
        capitalFinal += aportacionMensual;
        capitalFinal *= (1 + interesMensual);
    }

    let totalAportado = capitalInicial + (aportacionMensual * meses);
    let beneficio = capitalFinal - totalAportado;

    document.getElementById("resultado").innerHTML = `
        <strong>Capital aportado:</strong> ${formatearEuros(totalAportado)}<br>
        <strong>Beneficio estimado:</strong> ${formatearEuros(beneficio)}<br>
        <strong>Capital final estimado:</strong> ${formatearEuros(capitalFinal)}
    `;
}

function formatearEuros(cantidad) {
    return cantidad.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR"
    });
}

function reiniciarCalculadora() {
    document.getElementById("capitalInicial").value = "";
    document.getElementById("aportacionMensual").value = "";
    document.getElementById("rentabilidadAnual").value = "";
    document.getElementById("anos").value = "";
    document.getElementById("resultado").innerHTML = "";
}
