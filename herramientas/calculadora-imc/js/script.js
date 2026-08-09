const CONFIG = Object.freeze({
    herramienta: Object.freeze({
        url: "https://imoancy.com/herramientas/calculadora-imc/"
    })
});

document.getElementById("calculadoraForm").addEventListener("submit", function (e) {

    e.preventDefault();

    const peso = parseFloat(document.getElementById("peso").value);
    const altura = parseFloat(document.getElementById("altura").value) / 100;

    const imc = peso / (altura * altura);

    let clasificacion = "";

    if (imc < 18.5) {
        clasificacion = "🔵 Bajo peso";
    } else if (imc < 25) {
        clasificacion = "🟢 Peso normal";
    } else if (imc < 30) {
        clasificacion = "🟠 Sobrepeso";
    } else {
        clasificacion = "🔴 Obesidad";
    }

    let mensaje = "";

    if (imc < 18.5) {
        mensaje = "Tu peso está por debajo del rango considerado saludable. Si tienes dudas, consulta con un profesional sanitario.";
    } else if (imc < 25) {
        mensaje = "¡Enhorabuena! Tu peso se encuentra dentro del rango saludable según la Organización Mundial de la Salud.";
    } else if (imc < 30) {
        mensaje = "Tu IMC indica sobrepeso. Mantener una alimentación equilibrada y realizar actividad física puede ayudarte a mejorar tu salud.";
    } else {
        mensaje = "Tu IMC indica obesidad. Es recomendable consultar con un profesional sanitario para recibir una valoración personalizada.";
    }

    // Peso saludable según un IMC entre 18.5 y 24.9
    const pesoMinimo = 18.5 * (altura * altura);
    const pesoMaximo = 24.9 * (altura * altura);

    document.getElementById("resultado").innerHTML = `
    <div class="resultado-card">

        <h2>Tu IMC</h2>

        <div class="numero-imc">
            ${imc.toFixed(1)}
        </div>

        <p class="clasificacion">
            ${clasificacion}
        </p>

        <div class="barra-imc">
            <div class="barra-color"></div>
            <div class="marcador" style="left:${Math.max(0, Math.min(((imc - 15) / 25) * 100, 100))}%"></div>
        </div>

        <p class="mensaje">
            ${mensaje}
        </p>

        <div class="peso-saludable">

            <h3>Peso saludable para tu altura</h3>

            <p>
                <strong>${pesoMinimo.toFixed(1)} kg</strong>
                -
                <strong>${pesoMaximo.toFixed(1)} kg</strong>
            </p>

        </div>

    </div>
    `;

    // Mostrar el plan personalizado
    mostrarPlan(clasificacion);
    mostrarRiesgo(clasificacion);

});

function mostrarPlan(clasificacion) {

    let contenido = "";

    switch (clasificacion) {

        case "🔵 Bajo peso":
            contenido = `
                <h3>⚖️ Objetivo: ganar peso de forma saludable</h3>
                <ul>
                    <li>✅ Aumenta ligeramente tu consumo de calorías.</li>
                    <li>🥩 Prioriza proteínas de calidad.</li>
                    <li>🏋️ Realiza entrenamiento de fuerza.</li>
                    <li>🥜 Añade frutos secos, aceite de oliva y alimentos nutritivos.</li>
                    <li>👨‍⚕️ Consulta con un profesional sanitario si la pérdida de peso no tiene explicación.</li>
                </ul>
            `;
            break;

        case "🟢 Peso normal":
            contenido = `
                <h3>✅ Excelente trabajo</h3>
                <ul>
                    <li>🥗 Mantén una alimentación equilibrada.</li>
                    <li>🚶 Realiza al menos 150 minutos de actividad física a la semana.</li>
                    <li>💧 Mantente bien hidratado.</li>
                    <li>😴 Descansa entre 7 y 9 horas diarias.</li>
                    <li>📅 Controla tu peso periódicamente.</li>
                </ul>
            `;
            break;

        case "🟠 Sobrepeso":
            contenido = `
                <h3>📉 Objetivo: reducir grasa corporal</h3>
                <ul>
                    <li>🥗 Reduce ligeramente las calorías.</li>
                    <li>🚶 Camina todos los días.</li>
                    <li>🏋️ Combina entrenamiento de fuerza y cardio.</li>
                    <li>🍩 Reduce ultraprocesados y bebidas azucaradas.</li>
                    <li>💧 Prioriza el agua frente a los refrescos.</li>
                </ul>
            `;
            break;

        case "🔴 Obesidad":
            contenido = `
                <h3>❤️ Prioriza tu salud</h3>
                <ul>
                    <li>👨‍⚕️ Consulta con un profesional sanitario.</li>
                    <li>🥗 Introduce cambios progresivos en tu alimentación.</li>
                    <li>🚶 Empieza con ejercicio adaptado a tu condición física.</li>
                    <li>😴 Cuida tu descanso diario.</li>
                    <li>🎯 Márcate objetivos pequeños y alcanzables.</li>
                </ul>
            `;
            break;

    }

    document.getElementById("contenidoPlan").innerHTML = contenido;
    document.getElementById("planPersonalizado").style.display = "block";

}
function mostrarRiesgo(clasificacion){

    const riesgo = document.getElementById("riesgoSalud");

    riesgo.className = "riesgo-salud";

    switch(clasificacion){

        case "🔵 Bajo peso":

            riesgo.classList.add("riesgo-bajo");

            riesgo.innerHTML = `
                <strong>🟦 Riesgo para la salud: Leve</strong><br>
                Puede estar asociado a déficits nutricionales si se mantiene en el tiempo.
            `;

        break;

        case "🟢 Peso normal":

            riesgo.classList.add("riesgo-normal");

            riesgo.innerHTML = `
                <strong>🟩 Riesgo para la salud: Muy bajo</strong><br>
                Mantén tus hábitos saludables para conservar este estado.
            `;

        break;

        case "🟠 Sobrepeso":

            riesgo.classList.add("riesgo-medio");

            riesgo.innerHTML = `
                <strong>🟨 Riesgo para la salud: Moderado</strong><br>
                Reducir ligeramente el peso puede aportar beneficios importantes.
            `;

        break;

        case "🔴 Obesidad":

            riesgo.classList.add("riesgo-alto");

            riesgo.innerHTML = `
                <strong>🟥 Riesgo para la salud: Elevado</strong><br>
                Es recomendable consultar con un profesional sanitario para recibir asesoramiento.
            `;

        break;

    }

}
