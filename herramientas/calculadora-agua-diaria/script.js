function calcularAgua() {

    let peso = Number(document.getElementById("peso").value);
    let sexo = document.getElementById("sexo").value;
    let actividad = document.getElementById("actividad").value;

    if (peso <= 0 || isNaN(peso)) {
        alert("Introduce un peso válido.");
        return;
    }

    // Cálculo base (35 ml por kg)
    let litros = (peso * 35) / 1000;

    // Ajuste por sexo
    if (sexo === "hombre") {
        litros += 0.3;
    }

    // Ajuste por actividad
    let extra = "";
    switch (actividad) {

        case "ligero":
            litros += 0.3;
            extra = "Añade agua antes y después de la actividad física.";
            break;

        case "moderado":
            litros += 0.6;
            extra = "Mantente hidratado durante todo el entrenamiento.";
            break;

        case "intenso":
            litros += 1;
            extra = "Con actividad intensa debes reponer líquidos con frecuencia.";
            break;

        default:
            extra = "Mantén una hidratación constante durante el día.";
    }

    let vasos = Math.round((litros * 1000) / 250);

    document.getElementById("resultado").style.display = "block";

    document.getElementById("resultado").innerHTML = `
        <h2>💧 Resultado</h2>

        <p><strong>Agua recomendada:</strong> ${litros.toFixed(1)} litros al día</p>

        <p><strong>Equivale aproximadamente a:</strong> ${vasos} vasos de agua.</p>

        <hr>

        <p>${extra}</p>

        <br>

        <p>
        ⚠️ Recuerda que estas cifras son orientativas. Si hace mucho calor,
        estás enfermo o realizas ejercicio prolongado, tus necesidades pueden aumentar.
        </p>
    `;

}

function reiniciarFormulario() {

    document.getElementById("peso").value = "";
    document.getElementById("sexo").value = "hombre";
    document.getElementById("actividad").value = "sedentario";

    document.getElementById("resultado").style.display = "none";
    document.getElementById("resultado").innerHTML = `
    <div class="resultado-card">

        <h2>💧 Tu hidratación recomendada</h2>

        <div class="litros">
            ${litros.toFixed(1)} L
        </div>

        <div class="vasos">
            🥤 Aproximadamente <strong>${vasos}</strong> vasos de agua
        </div>

        <div class="barra">

            <div class="barra-progreso"
                 style="width:${Math.min((litros / 4) * 100, 100)}%">
            </div>

        </div>

        <p class="mensaje">
            ${extra}
        </p>

        <div class="info">

            ⚠️ Esta cantidad es una recomendación general.
            Si hace mucho calor, tienes fiebre o realizas ejercicio intenso,
            podrías necesitar beber más agua.

        </div>

    </div>
`;

}