/* ==========================================================
   Imoancy
   RESULTS.JS
   Motor de renderizado
   Versión 1.0
========================================================== */

"use strict";

/* ==========================================================
   MOSTRAR RESULTADOS
========================================================== */

function mostrarResultados(datos){

    actualizarResultadoPrincipal(datos);

    actualizarTarjetas(datos);

    actualizarDetalles(datos);

    actualizarRecomendacion(datos);

    mostrarSeccionResultados();

}


/* ==========================================================
   RESULTADO PRINCIPAL
========================================================== */

function actualizarResultadoPrincipal(datos){

    $("#calorias-principales").textContent =
        formatearNumero(redondear(datos.calorias));

    $("#resultado-objetivo").textContent =
        OBJETIVOS[datos.objetivo].nombre;

    $("#resultado-etiqueta").textContent =
        "Calorías recomendadas";

}


/* ==========================================================
   TARJETAS SECUNDARIAS
========================================================== */

function actualizarTarjetas(datos){

    $("#calorias-perder").textContent =
        formatearNumero(redondear(datos.tdee*0.85));

    $("#calorias-mantener").textContent =
        formatearNumero(redondear(datos.tdee));

    $("#calorias-ganar").textContent =
        formatearNumero(redondear(datos.tdee*1.10));

}


/* ==========================================================
   DETALLES
========================================================== */

function actualizarDetalles(datos){

    $("#resultado-tmb").textContent =
        formatearNumero(redondear(datos.tmb));

    $("#resultado-tdee").textContent =
        formatearNumero(redondear(datos.tdee));

    $("#resultado-factor").textContent =
        ACTIVIDAD[datos.actividad].nombre +
        " (" +
        ACTIVIDAD[datos.actividad].factor +
        ")";

    $("#resultado-ajuste").textContent =
        OBJETIVOS[datos.objetivo].nombre;

}


/* ==========================================================
   RECOMENDACIÓN
========================================================== */

function actualizarRecomendacion(datos){

    const titulo=$("#recomendacion-titulo");

    const contenido=$("#recomendacion-contenido");

    switch(datos.objetivo){

        case "perder":

            titulo.textContent="Perder grasa";

            contenido.innerHTML=`

                <p>
                    Mantén un déficit moderado de calorías,
                    prioriza alimentos saciantes,
                    duerme bien y realiza entrenamiento de fuerza.
                </p>

            `;

        break;

        case "mantener":

            titulo.textContent="Mantener peso";

            contenido.innerHTML=`

                <p>
                    Intenta mantener una alimentación equilibrada
                    y un nivel constante de actividad física.
                </p>

            `;

        break;

        case "ganar":

            titulo.textContent="Ganar músculo";

            contenido.innerHTML=`

                <p>
                    Combina un ligero superávit calórico
                    con entrenamiento de fuerza
                    y suficiente proteína diaria.
                </p>

            `;

        break;

    }

}


/* ==========================================================
   MOSTRAR SECCIÓN
========================================================== */

function mostrarSeccionResultados(){

    const seccion=$("#resultados");

    seccion.hidden=false;

    scrollHasta(seccion);

}


/* ==========================================================
   OCULTAR RESULTADOS
========================================================== */

function ocultarResultados(){

    $("#resultados").hidden=true;

}


/* ==========================================================
   NUEVO CÁLCULO
========================================================== */

$("#boton-nuevo-calculo").addEventListener("click",()=>{

    reiniciarFormulario();

    ocultarResultados();

});


/* ==========================================================
   COPIAR RESULTADO
========================================================== */

$("#boton-copiar").addEventListener("click",async()=>{

    const texto=`

🔥 Calculadora de Calorías

Calorías recomendadas:
${$("#calorias-principales").textContent} kcal

TMB:
${$("#resultado-tmb").textContent} kcal

TDEE:
${$("#resultado-tdee").textContent} kcal

Generado con Imoancy

`;

    const copiado=await copiarTexto(texto);

    if(copiado){

        alert("Resultado copiado al portapapeles.");

    }

});