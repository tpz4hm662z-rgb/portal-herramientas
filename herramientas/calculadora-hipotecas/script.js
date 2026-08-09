function calcularHipoteca() {

    let importe = Number(document.getElementById("importe").value);
    let entrada = Number(document.getElementById("entrada").value);
    let interesAnual = Number(document.getElementById("interes").value);
    let anos = Number(document.getElementById("anos").value);

    if (importe <= 0 || entrada < 0 || interesAnual <= 0 || anos <= 0 || entrada >= importe) {
        document.getElementById("resultado").innerHTML =
            "Por favor, introduce valores válidos.";
        return;
    }

    let capitalPrestado = importe - entrada;
    let porcentajeFinanciado = (capitalPrestado / importe) * 100;
    let porcentajeEntrada = (entrada / importe) * 100;

    let interesMensual = (interesAnual / 100) / 12;
    let numeroCuotas = anos * 12;

    function calcularCuota(plazo) {
        let cuotas = plazo * 12;

        return capitalPrestado *
            (interesMensual * Math.pow(1 + interesMensual, cuotas)) /
            (Math.pow(1 + interesMensual, cuotas) - 1);
    }

    let cuotaMensual = calcularCuota(anos);
    let totalPagado = cuotaMensual * numeroCuotas;
    let interesesTotales = totalPagado - capitalPrestado;

    let cuota20 = calcularCuota(20);
    let cuota25 = calcularCuota(25);
    let cuota30 = calcularCuota(30);

    function formatoEuro(numero) {
        return numero.toLocaleString("es-ES", {
            style: "currency",
            currency: "EUR"
        });
    }

    let aviso = "";

    if (porcentajeFinanciado > 80) {
        aviso = `
            <p class="aviso">
                Aviso: estás financiando más del 80% del valor de la vivienda. 
                Muchos bancos suelen exigir una entrada mayor o mejores condiciones económicas.
            </p>
        `;
    }

    document.getElementById("resultado").innerHTML = `
        <h3>Resultado estimado</h3>

        <strong>Precio de la vivienda:</strong> ${formatoEuro(importe)}<br>
        <strong>Entrada aportada:</strong> ${formatoEuro(entrada)} (${porcentajeEntrada.toFixed(2)}%)<br>
        <strong>Capital solicitado:</strong> ${formatoEuro(capitalPrestado)}<br>
        <strong>Porcentaje financiado:</strong> ${porcentajeFinanciado.toFixed(2)}%<br><br>

        <strong>Cuota mensual aproximada:</strong> ${formatoEuro(cuotaMensual)}<br>
        <strong>Total pagado al banco:</strong> ${formatoEuro(totalPagado)}<br>
        <strong>Intereses totales:</strong> ${formatoEuro(interesesTotales)}

        <hr>

        <h3>Comparativa de plazos</h3>

        <p><strong>20 años:</strong> ${formatoEuro(cuota20)}/mes</p>
        <p><strong>25 años:</strong> ${formatoEuro(cuota25)}/mes</p>
        <p><strong>30 años:</strong> ${formatoEuro(cuota30)}/mes</p>

        ${aviso}
    `;
}
function reiniciarFormulario() {

    document.getElementById("importe").value = "";
    document.getElementById("entrada").value = "";
    document.getElementById("interes").value = "";
    document.getElementById("anos").value = "";

    document.getElementById("resultado").innerHTML = "";
}