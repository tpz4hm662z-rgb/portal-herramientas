(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DoradaCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const LABELS = Object.freeze({
    fondo: { arena: "Arena limpia", mixto: "Mixto: arena y algunas piedras", roca: "Roca / mucho enganche", desconocido: "No lo sé" },
    mar: { calma: "Calmado", movido: "Algo movido", fuerte: "Fuerte / bastante corriente" },
    cebo: { tita: "Tita", americana: "Americana", playa: "Gusana de playa", cangrejo: "Cangrejo", muergo: "Muergo", quisquilla: "Quisquilla / camarón", choco: "Choco / calamar", otro: "Otro", recomendar: "Varias opciones sugeridas" },
    distancia: { normal: "No especialmente", lejos: "Sí, necesito bastante distancia", maxima: "Quiero priorizar máxima distancia" },
    objetivo: { general: "Doradas en general", grandes: "Intentar seleccionar ejemplares grandes" }
  });

  function item(id, title, text) { return { id, title, text }; }

  function configure(input) {
    const rocky = input.fondo === "roca";
    const mixed = input.fondo === "mixto";
    const unknown = input.fondo === "desconocido";
    const distance = input.distancia === "lejos" || input.distancia === "maxima";
    const rough = input.mar === "fuerte";
    const moving = input.mar === "movido";

    let montaje = item("montaje", "Montaje", "Plomo corrido, como configuración de partida para favorecer una presentación natural.");
    let linea = item("linea", "Línea", distance
      ? "0,14–0,18 mm como rango práctico de partida para buscar distancia sobre arena limpia, acompañado de una cola de rata/puente adecuado para soportar el lance. Adáptalo a tu equipo y a las condiciones reales."
      : "Diámetro equilibrado con tu equipo y el estado real del pesquero; en arena limpia puedes priorizar la presentación.");
    let gameta = item("gameta", "Gameta", "Larga, aproximadamente 1,5–2 m o más si puedes controlarla sin enredos.");
    let plomo = item("plomo", "Plomo", "Geometría tipo gota o aerodinámica, compatible con un fondo limpio y mar calmado.");
    const why = [];

    if (rocky) {
      montaje = item("montaje", "Montaje", "Plomo terminal abajo y gameta arriba para reducir enganches.");
      linea = item("linea", "Línea", "Claramente robusta y resistente al roce; con mucha piedra puede acercarse a 0,40 mm como orden orientativo, no como obligación.");
      gameta = item("gameta", "Gameta", "Más controlada y robusta que en arena, colocada por encima del plomo.");
      plomo = item("plomo", "Plomo", rough ? "Plomo terminal con buen agarre y una forma adecuada para trabajar sobre fondo rocoso y reducir enganches durante la recogida." : "Plomo terminal, buscando una forma adecuada para trabajar sobre fondo rocoso y reducir enganches durante la recogida.");
      why.push("La roca cambia la arquitectura: prima la resistencia al roce y la reducción de enganches.");
    } else if (mixed || unknown) {
      linea = item("linea", "Línea", "Algo más robusta que en arena limpia para ganar margen frente al roce.");
      gameta = item("gameta", "Gameta", "De longitud moderada a larga según enredos y presencia de piedra.");
      why.push(unknown ? "Al no conocer el fondo, partimos de una solución prudente y adaptable." : "El fondo mixto pide más precaución que la arena sin llegar automáticamente a una configuración de roca extrema.");
    } else {
      why.push("La arena limpia permite priorizar presentación y, cuando hace falta, distancia.");
    }

    if (!rocky && moving) {
      plomo = item("plomo", "Plomo", "Geometría con más agarre que una gota de lance, ajustada al movimiento del mar.");
      why.push("Con el mar algo movido conviene ganar estabilidad sin rehacer todo el montaje.");
    }
    if (!rocky && rough) {
      plomo = item("plomo", "Plomo", "Pirámide o familia de mayor agarre; reserva la grapa para una corriente especialmente exigente.");
      linea = item("linea", "Línea", (mixed || unknown ? "Configuración robusta" : (distance ? "Aumenta el diámetro respecto al rango de partida para distancia en calma" : "Algo más robusta que en calma")) + ", ajustada a tu equipo y al pesquero.");
      gameta = item("gameta", "Gameta", "Longitud controlable en corriente; acórtala si aparecen enredos.");
      why.push("La corriente fuerte afecta sobre todo al agarre, la estabilidad y el margen de robustez.");
    }

    const parts = [montaje, linea];
    if (distance && !rocky) parts.push(item("puente", "Puente / cola de rata", "Recomendable si empleas una línea madre relativamente fina para ganar distancia; debe ser compatible con el lance y tu equipo."));
    parts.push(gameta);
    parts.push(item("anzuelo", "Anzuelo", "Elige el tamaño en función del tamaño y la presentación del cebo, evitando que quede desproporcionado. Comprueba que la punta esté bien afilada antes de lanzar."));
    parts.push(plomo);

    let baitText = LABELS.cebo[input.cebo] || "Cebo a tu elección";
    if (input.cebo === "recomendar") {
      baitText = distance ? "Tita, americana o gusana de playa son alternativas resistentes o adecuadas para el lance; elige según disponibilidad y presentación." : (rocky ? "Cangrejo, tita o choco/calamar son opciones razonables; valora cuál puedes presentar y controlar mejor." : "Tita, americana, gusana de playa, cangrejo o muergo son alternativas razonables; no hay una única elección universal.");
    } else if (input.cebo === "cangrejo") {
      baitText += ". Favorece una presentación natural y poco alterada; la forma de presentarlo puede variar entre pescadores.";
    }
    parts.push(item("cebo", "Cebo", baitText));

    if (distance && !rocky) why.push(input.distancia === "maxima" ? "Al priorizar la máxima distancia, una línea madre adecuada con puente y un conjunto aerodinámico cobran más importancia." : "La necesidad de distancia favorece un conjunto de lance eficiente sin sacrificar la presentación.");
    if (mixed) why.push("Si los enganches son frecuentes, utiliza la configuración para fondo rocoso.");

    return { parts, why, input: Object.assign({}, input) };
  }

  function compare(previous, next) {
    const oldResult = configure(previous);
    const newResult = configure(next);
    const oldMap = Object.fromEntries(oldResult.parts.map(x => [x.id, x]));
    const newMap = Object.fromEntries(newResult.parts.map(x => [x.id, x]));
    const ids = Array.from(new Set([...Object.keys(oldMap), ...Object.keys(newMap)]));
    return {
      changed: ids.filter(id => !oldMap[id] || !newMap[id] || oldMap[id].text !== newMap[id].text).map(id => newMap[id] || item(id, oldMap[id].title, "Ya no es necesario en esta configuración.")),
      maintained: ids.filter(id => oldMap[id] && newMap[id] && oldMap[id].text === newMap[id].text).map(id => newMap[id]),
      result: newResult
    };
  }

  return { configure, compare, labels: LABELS };
});
