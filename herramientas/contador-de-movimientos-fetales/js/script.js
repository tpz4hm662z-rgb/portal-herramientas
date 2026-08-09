/**
 * Contador de Movimientos Fetales PRO — Bloque 2
 * Motor funcional de sesión sin persistencia ni interpretación clínica.
 */
"use strict";

/* Selectores */
const SELECTORS = Object.freeze({
  screens: "[data-screen]", form: "#setup-form", week: "#pregnancy-week",
  type: 'input[name="sessionType"]:checked', types: 'input[name="sessionType"]',
  perception: 'input[name="perception"]:checked',
  duration: "#duration", durationField: "#duration-field", movementButton: "#movement-button",
  count: "#movement-count", counterAnnouncement: "#counter-announcement",
  timer: "#session-timer", remaining: "#remaining-time", objective: "#session-objective",
  lastMovement: "#last-movement", list: "#movement-list", errors: "#app-errors",
  status: "#app-status", average: "#provisional-average", min: "#provisional-min",
  max: "#provisional-max", historyList: "#history-list", historyEmpty: "#history-empty",
  deleteAll: "#delete-all-button", saveButton: "#save-session-button"
});

const CONFIG = Object.freeze({
  herramienta: Object.freeze({
    url: "https://imoancy.com/herramientas/contador-de-movimientos-fetales/"
  })
});

const STORAGE_KEY = "herramientas360_movimientos_fetales";
const STORAGE_VERSION = 1;
const HISTORY_LIMIT = 100;

/* Estado único de la aplicación */
const appState = {
  active: false,
  paused: false,
  currentScreen: "setup",
  registrationType: "free",
  perception: null,
  pregnancyWeek: null,
  startedAt: null,
  finishedAt: null,
  segmentStartedAt: null,
  accumulatedMs: 0,
  movements: [],
  intervals: [],
  objective: null,
  programmedDurationMs: null,
  remainingMs: null,
  timerId: null,
  targetAcknowledged: false,
  timeAcknowledged: false,
  lastRegistrationRealAt: 0,
  sessionId: null,
  pendingDeleteId: null,
  storageLoaded: false,
  storage: { version: STORAGE_VERSION, history: [], draft: null },
  draftTimerId: null
};

/* Utilidades puras */
function pad(value) { return String(value).padStart(2, "0"); }

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatClock(date) {
  return date ? new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date) : "—";
}

function localDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function elapsedLabel(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `Tiempo transcurrido: ${hours} horas, ${minutes} minutos y ${seconds} segundos`;
}

function elapsedAt(state, now = Date.now()) {
  if (!state.active || state.paused || state.segmentStartedAt === null) return state.accumulatedMs;
  return state.accumulatedMs + Math.max(0, now - state.segmentStartedAt);
}

function calculateIntervals(movements) {
  return movements.slice(1).map((movement, index) => movement.elapsedMs - movements[index].elapsedMs);
}

function calculateStats(intervals) {
  if (!intervals.length) return { average: null, min: null, max: null };
  return {
    average: intervals.reduce((sum, value) => sum + value, 0) / intervals.length,
    min: Math.min(...intervals),
    max: Math.max(...intervals)
  };
}

function methodLabel(type, durationMs) {
  if (type === "ten") return "Contar hasta 10 movimientos";
  if (type === "period") return `Periodo de ${Math.round(durationMs / 60000)} minutos`;
  return "Registro libre";
}

function perceptionLabel(value) {
  return ({ usual: "Como habitualmente", different: "Algo diferentes", less: "Claramente menos frecuentes o más débiles", unsure: "No estoy segura", skip: "Prefiero no responder" })[value] || "No respondida";
}

function buildSummary(state) {
  const stats = calculateStats(state.intervals);
  return {
    count: state.movements.length,
    durationMs: state.accumulatedMs,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    tenthMs: state.movements.length >= 10 ? state.movements[9].elapsedMs : null,
    averageMs: stats.average,
    shortestMs: stats.min,
    longestMs: stats.max,
    method: methodLabel(state.registrationType, state.programmedDurationMs),
    week: state.pregnancyWeek
  };
}

/* Interpretación informativa: describe datos declarados sin aplicar criterios clínicos. */
function buildInterpretation(state) {
  let modeText = "";
  if (state.registrationType === "free") {
    modeText = "Has registrado los movimientos percibidos durante una sesión libre. El número de movimientos y la duración deben entenderse junto con el patrón habitual de tu bebé.";
  } else if (state.registrationType === "ten" && state.movements.length >= 10) {
    modeText = "Has completado el objetivo seleccionado. Cada bebé tiene su propio patrón de actividad y este registro representa únicamente esta sesión.";
  } else if (state.registrationType === "ten") {
    modeText = "Has finalizado el registro antes de completar el objetivo seleccionado. Este resultado no permite extraer conclusiones por sí solo.";
  } else if (state.timeAcknowledged) {
    modeText = "La sesión ha alcanzado el tiempo configurado. Los movimientos mostrados corresponden al periodo registrado y, si elegiste continuar, también al tiempo añadido después.";
  } else {
    modeText = "Has finalizado la sesión antes de alcanzar el tiempo configurado. Los movimientos mostrados corresponden únicamente al periodo que registraste.";
  }

  const patternTexts = {
    usual: "Has indicado que hoy percibes los movimientos como habitualmente. Esta respuesta describe tu percepción y no constituye una valoración clínica.",
    different: "Has indicado que hoy percibes algunos cambios respecto al patrón habitual. El contador no puede determinar la causa de esa diferencia. Contacta ahora con el servicio sanitario que sigue tu embarazo para recibir indicaciones.",
    less: "Has indicado que percibes una disminución clara respecto al patrón habitual o movimientos más débiles. Esta herramienta no puede valorar la causa ni confirmar el bienestar del bebé. Contacta ahora con tu matrona, unidad de maternidad, urgencias obstétricas o el servicio sanitario que sigue tu embarazo para recibir indicaciones. No esperes a comprobar si mejora por sí solo.",
    unsure: "Has indicado que no estás segura de cómo comparar los movimientos. Si tienes dudas, percibes menos movimientos, movimientos más débiles o un cambio respecto al patrón habitual de tu bebé, contacta ahora con el servicio sanitario que sigue tu embarazo para recibir indicaciones."
  };

  return {
    general: "Este registro resume únicamente los movimientos que has percibido durante esta sesión. Por sí solo no permite valorar el bienestar fetal ni sustituye las indicaciones del equipo sanitario.",
    mode: modeText,
    pattern: patternTexts[state.perception] || null
  };
}

/* Persistencia local: historial y borrador comparten una única clave versionada. */
function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyStorage() {
  return { version: STORAGE_VERSION, history: [], draft: null };
}

function isStoredSession(value) {
  return Boolean(value && typeof value === "object" && typeof value.id === "string" &&
    typeof value.date === "string" && typeof value.time === "string" && typeof value.method === "string" &&
    value.summary && typeof value.summary === "object" && Number.isFinite(value.summary.count) &&
    Number.isFinite(value.summary.durationMs) && typeof value.summary.startedAt === "string" &&
    typeof value.summary.finishedAt === "string" && Array.isArray(value.movements) &&
    value.movements.every((movement) => movement && Number.isFinite(movement.elapsedMs)) &&
    value.interpretation && typeof value.interpretation.general === "string" && typeof value.interpretation.mode === "string");
}

function normalizeStorage(value) {
  const source = Array.isArray(value) ? { history: value, draft: null } : value;
  if (!source || typeof source !== "object") return emptyStorage();
  const unique = new Map();
  (Array.isArray(source.history) ? source.history : []).filter(isStoredSession).forEach((session) => {
    if (!unique.has(session.id)) unique.set(session.id, session);
  });
  const history = Array.from(unique.values())
    .sort((a, b) => new Date(b.savedAt || b.finishedAt || 0) - new Date(a.savedAt || a.finishedAt || 0))
    .slice(0, HISTORY_LIMIT);
  const draft = isValidDraft(source.draft) ? source.draft : null;
  return { version: STORAGE_VERSION, history, draft };
}

function isValidDraft(draft) {
  return Boolean(draft && typeof draft === "object" && typeof draft.sessionId === "string" &&
    ["free", "ten", "period"].includes(draft.registrationType) &&
    Number.isInteger(draft.pregnancyWeek) && Array.isArray(draft.movements) &&
    draft.movements.every((movement) => movement && Number.isFinite(movement.elapsedMs)) &&
    Number.isFinite(draft.accumulatedMs));
}

function loadStorage() {
  if (appState.storageLoaded) return appState.storage;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    appState.storage = raw ? normalizeStorage(JSON.parse(raw)) : emptyStorage();
  } catch (_error) {
    appState.storage = emptyStorage();
  }
  appState.storageLoaded = true;
  return appState.storage;
}

function persistStorage(nextStorage, errorMessage) {
  const normalized = normalizeStorage(nextStorage);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    appState.storage = normalized;
    appState.storageLoaded = true;
    return true;
  } catch (_error) {
    showError(errorMessage || "No ha sido posible guardar los datos en este navegador.");
    return false;
  }
}

function serializeDraft() {
  if (!appState.active) return null;
  return {
    sessionId: appState.sessionId,
    registrationType: appState.registrationType,
    pregnancyWeek: appState.pregnancyWeek,
    perception: appState.perception,
    startedAt: appState.startedAt?.toISOString() || null,
    accumulatedMs: elapsedAt(appState),
    movements: appState.movements.map((movement) => ({
      number: movement.number,
      absoluteTime: movement.absoluteTime.toISOString(),
      elapsedMs: movement.elapsedMs,
      intervalMs: movement.intervalMs
    })),
    objective: appState.objective,
    programmedDurationMs: appState.programmedDurationMs,
    remainingMs: appState.remainingMs,
    paused: appState.paused,
    targetAcknowledged: appState.targetAcknowledged,
    timeAcknowledged: appState.timeAcknowledged,
    savedAt: new Date().toISOString()
  };
}

function saveDraft() {
  cancelScheduledDraft();
  if (!appState.active) return;
  const storage = loadStorage();
  persistStorage({ ...storage, draft: serializeDraft() }, "No ha sido posible preparar la recuperación de esta sesión.");
}

function scheduleDraftSave() {
  cancelScheduledDraft();
  appState.draftTimerId = window.setTimeout(() => {
    appState.draftTimerId = null;
    saveDraft();
  }, 300);
}

function cancelScheduledDraft() {
  if (appState.draftTimerId !== null) window.clearTimeout(appState.draftTimerId);
  appState.draftTimerId = null;
}

function clearDraft() {
  cancelScheduledDraft();
  const storage = loadStorage();
  if (storage.draft) persistStorage({ ...storage, draft: null }, "No ha sido posible eliminar la sesión temporal.");
}

function createStoredSession() {
  const summary = buildSummary(appState);
  const interpretation = buildInterpretation(appState);
  return {
    id: appState.sessionId,
    savedAt: new Date().toISOString(),
    date: localDateKey(appState.startedAt),
    time: formatClock(appState.startedAt),
    week: appState.pregnancyWeek,
    method: methodLabel(appState.registrationType, appState.programmedDurationMs),
    registrationType: appState.registrationType,
    perception: appState.perception,
    startedAt: appState.startedAt.toISOString(),
    finishedAt: appState.finishedAt.toISOString(),
    movements: appState.movements.map((movement) => ({ number: movement.number, elapsedMs: movement.elapsedMs, intervalMs: movement.intervalMs })),
    summary: {
      count: summary.count, durationMs: summary.durationMs,
      startedAt: appState.startedAt.toISOString(), finishedAt: appState.finishedAt.toISOString(),
      tenthMs: summary.tenthMs, averageMs: summary.averageMs,
      shortestMs: summary.shortestMs, longestMs: summary.longestMs,
      method: summary.method, week: summary.week
    },
    interpretation
  };
}

function saveCompletedSession() {
  if (appState.active || !appState.finishedAt || !appState.sessionId) return;
  clearError();
  const storage = loadStorage();
  if (storage.history.some((session) => session.id === appState.sessionId)) {
    announce("Esta sesión ya estaba guardada.");
    markSessionSaved();
    return;
  }
  const history = [createStoredSession(), ...storage.history].slice(0, HISTORY_LIMIT);
  if (persistStorage({ ...storage, history }, "No ha sido posible guardar la sesión. El almacenamiento del navegador puede estar lleno.")) {
    markSessionSaved();
    renderHistory();
    announce("Sesión guardada en este navegador.");
  }
}

function markSessionSaved() {
  const button = document.querySelector(SELECTORS.saveButton);
  if (button) { button.disabled = true; button.textContent = "Sesión guardada"; }
}

function prepareSaveButton() {
  const button = document.querySelector(SELECTORS.saveButton);
  if (button) { button.disabled = false; button.textContent = "Guardar sesión"; }
}

/* Gestión del estado */
function resetState() {
  stopTimer();
  cancelScheduledDraft();
  Object.assign(appState, {
    active: false, paused: false, currentScreen: "setup", registrationType: "free", perception: null,
    pregnancyWeek: null, startedAt: null, finishedAt: null, segmentStartedAt: null,
    accumulatedMs: 0, movements: [], intervals: [], objective: null,
    programmedDurationMs: null, remainingMs: null, timerId: null,
    targetAcknowledged: false, timeAcknowledged: false, lastRegistrationRealAt: 0,
    sessionId: null, pendingDeleteId: null, draftTimerId: null
  });
}

function initializeSession(configuration, now = Date.now()) {
  resetState();
  Object.assign(appState, {
    active: true,
    sessionId: createId(),
    registrationType: configuration.type,
    perception: configuration.perception,
    pregnancyWeek: configuration.week,
    startedAt: new Date(now),
    segmentStartedAt: now,
    objective: configuration.type === "ten" ? 10 : null,
    programmedDurationMs: configuration.durationMs,
    remainingMs: configuration.durationMs
  });
}

/* Validación */
function validateConfiguration() {
  const weekInput = document.querySelector(SELECTORS.week);
  const typeInput = document.querySelector(SELECTORS.type);
  const durationInput = document.querySelector(SELECTORS.duration);
  const perceptionInput = document.querySelector(SELECTORS.perception);
  const week = Number(weekInput?.value);
  clearError();
  weekInput?.setAttribute("aria-invalid", "false");
  if (!weekInput || !weekInput.value || !Number.isInteger(week) || week < 1 || week > 45) {
    weekInput?.setAttribute("aria-invalid", "true");
    showError("Introduce una semana válida.");
    weekInput?.focus();
    return null;
  }
  if (!typeInput) { showError("Selecciona un tipo de registro."); return null; }
  const durationMinutes = typeInput.value === "period" ? Number(durationInput?.value) : null;
  if (typeInput.value === "period" && ![15, 30, 60, 120].includes(durationMinutes)) {
    showError("Selecciona una duración válida.");
    durationInput?.focus();
    return null;
  }
  return { week, type: typeInput.value, durationMs: durationMinutes ? durationMinutes * 60000 : null, perception: perceptionInput?.value || null };
}

/* Cronómetro basado en tiempo real */
function startTimer() {
  stopTimer();
  updateTimeDisplay();
  appState.timerId = window.setInterval(updateTimeDisplay, 250);
}

function stopTimer() {
  if (appState.timerId !== null) window.clearInterval(appState.timerId);
  appState.timerId = null;
}

function updateTimeDisplay() {
  if (!appState.active) return;
  const elapsed = elapsedAt(appState);
  renderTimer(elapsed);
  renderLastMovement(elapsed);
  if (appState.programmedDurationMs !== null && !appState.timeAcknowledged) {
    appState.remainingMs = Math.max(0, appState.programmedDurationMs - elapsed);
    renderRemaining(appState.remainingMs);
    if (appState.remainingMs === 0) handleProgrammedTimeEnd();
  }
}

/* Motor de sesión */
function startSession(event) {
  event.preventDefault();
  const configuration = validateConfiguration();
  if (!configuration) return;
  initializeSession(configuration);
  renderSessionReset();
  showScreen("active", false);
  startTimer();
  saveDraft();
  const movementButton = document.querySelector(SELECTORS.movementButton);
  if (movementButton) { movementButton.disabled = false; movementButton.focus(); }
  announce("Sesión iniciada. Cero movimientos registrados.");
}

function registerMovement() {
  const now = Date.now();
  if (!appState.active || appState.paused || now - appState.lastRegistrationRealAt < 180) return;
  clearError();
  appState.lastRegistrationRealAt = now;
  const elapsedMs = elapsedAt(appState, now);
  appState.movements.push({ number: appState.movements.length + 1, absoluteTime: new Date(now), elapsedMs, intervalMs: null });
  recalculateMovementData();
  scheduleDraftSave();
  renderMovementData(true);
  provideMovementFeedback();
  if (appState.registrationType === "ten" && appState.movements.length === 10 && !appState.targetAcknowledged) {
    appState.targetAcknowledged = true;
    saveDraft();
    openDialog("target-dialog", document.querySelector(SELECTORS.movementButton));
  }
}

function undoMovement() {
  if (!appState.active || appState.paused) return;
  if (!appState.movements.length) { showError("No existe ningún movimiento que deshacer."); return; }
  clearError();
  appState.movements.pop();
  recalculateMovementData();
  scheduleDraftSave();
  renderMovementData();
  announce(`Último movimiento eliminado. Quedan ${appState.movements.length}.`);
}

function recalculateMovementData() {
  appState.intervals = calculateIntervals(appState.movements);
  appState.movements.forEach((movement, index) => {
    movement.number = index + 1;
    movement.intervalMs = index ? movement.elapsedMs - appState.movements[index - 1].elapsedMs : null;
  });
}

function pauseSession(options = {}) {
  if (!appState.active || appState.paused) return;
  clearError();
  appState.accumulatedMs = elapsedAt(appState);
  appState.segmentStartedAt = null;
  appState.paused = true;
  stopTimer();
  saveDraft();
  const movementButton = document.querySelector(SELECTORS.movementButton);
  if (movementButton) movementButton.disabled = true;
  showScreen("paused");
  if (!options.silent) announce("Sesión pausada.");
}

function resumeSession() {
  if (!appState.active || !appState.paused) return;
  clearError();
  appState.paused = false;
  appState.segmentStartedAt = Date.now();
  showScreen("active", false);
  if (appState.timeAcknowledged) renderRemaining(null);
  startTimer();
  saveDraft();
  const movementButton = document.querySelector(SELECTORS.movementButton);
  if (movementButton) { movementButton.disabled = false; movementButton.focus(); }
  announce("Sesión reanudada.");
}

function finishSession() {
  if (!appState.active) return;
  clearError();
  const now = Date.now();
  if (!appState.paused) appState.accumulatedMs = elapsedAt(appState, now);
  appState.segmentStartedAt = null;
  appState.finishedAt = new Date(now);
  appState.active = false;
  appState.paused = false;
  stopTimer();
  clearDraft();
  prepareSaveButton();
  renderSummary(buildSummary(appState));
  renderInterpretation(buildInterpretation(appState));
  renderVisualizations(appState.movements, "#current-timeline", "#current-interval-chart");
  const printSessionDate = document.querySelector("#current-print-session-date");
  if (printSessionDate) printSessionDate.textContent = `Sesión del ${formatStoredDate(localDateKey(appState.startedAt))} · ${formatClock(appState.startedAt)}`;
  showScreen("result");
  announce("Registro completado. Se muestra el resumen de la sesión.");
}

function handleProgrammedTimeEnd() {
  if (appState.timeAcknowledged || !appState.active) return;
  appState.timeAcknowledged = true;
  pauseSession({ silent: true });
  announce("El tiempo seleccionado ha finalizado.");
  openDialog("time-dialog", null);
}

/* Actualización del DOM */
function showScreen(name, focus = true) {
  const target = document.querySelector(`[data-screen="${name}"]`);
  if (!target) return;
  document.querySelectorAll(SELECTORS.screens).forEach((screen) => { screen.hidden = screen !== target; });
  appState.currentScreen = name;
  if (focus) target.focus();
}

function renderSessionReset() {
  const objective = document.querySelector(SELECTORS.objective);
  if (objective) objective.textContent = methodLabel(appState.registrationType, appState.programmedDurationMs);
  renderMovementData();
  renderTimer(0);
  renderRemaining(appState.programmedDurationMs);
}

function renderTimer(elapsedMs) {
  const timer = document.querySelector(SELECTORS.timer);
  if (!timer) return;
  timer.textContent = formatDuration(elapsedMs);
  timer.dateTime = `PT${Math.floor(elapsedMs / 1000)}S`;
  timer.setAttribute("aria-label", elapsedLabel(elapsedMs));
}

function renderRemaining(remainingMs) {
  const element = document.querySelector(SELECTORS.remaining);
  if (!element) return;
  element.hidden = remainingMs === null;
  if (remainingMs !== null) element.textContent = `Tiempo restante: ${formatDuration(remainingMs)}`;
}

function renderMovementData(appendLatest = false) {
  const count = document.querySelector(SELECTORS.count);
  const announcement = document.querySelector(SELECTORS.counterAnnouncement);
  const list = document.querySelector(SELECTORS.list);
  if (count) count.textContent = String(appState.movements.length);
  if (announcement) announcement.textContent = `${appState.movements.length} movimientos registrados`;
  if (list) {
    if (appendLatest && appState.movements.length) {
      if (appState.movements.length === 1) list.replaceChildren();
      list.append(createMovementListItem(appState.movements[appState.movements.length - 1]));
    } else {
      list.replaceChildren();
      if (!appState.movements.length) {
        const empty = document.createElement("li"); empty.className = "empty-item";
        empty.textContent = "Todavía no se han registrado movimientos."; list.append(empty);
      } else {
        const fragment = document.createDocumentFragment();
        appState.movements.forEach((movement) => fragment.append(createMovementListItem(movement)));
        list.append(fragment);
      }
    }
  }
  const stats = calculateStats(appState.intervals);
  renderStat(SELECTORS.average, stats.average);
  renderStat(SELECTORS.min, stats.min);
  renderStat(SELECTORS.max, stats.max);
  renderLastMovement(elapsedAt(appState));
}

function createMovementListItem(movement) {
  const item = document.createElement("li");
  item.textContent = `Movimiento ${movement.number} — ${formatDuration(movement.elapsedMs)}${movement.intervalMs === null ? "" : ` — intervalo: ${formatDuration(movement.intervalMs)}`}`;
  return item;
}

function renderStat(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value === null ? "—" : formatDuration(value);
}

function renderLastMovement(currentElapsed) {
  const element = document.querySelector(SELECTORS.lastMovement);
  if (!element) return;
  const last = appState.movements[appState.movements.length - 1];
  element.textContent = last ? `Último movimiento registrado: hace ${formatDuration(currentElapsed - last.elapsedMs)}` : "Último movimiento registrado: —";
}

function renderSummary(summary) {
  const values = {
    "#result-count": String(summary.count), "#result-duration": formatDuration(summary.durationMs),
    "#result-start": formatClock(summary.startedAt), "#result-end": formatClock(summary.finishedAt),
    "#result-tenth": summary.tenthMs === null ? "No alcanzado" : formatDuration(summary.tenthMs),
    "#result-average": summary.averageMs === null ? "—" : formatDuration(summary.averageMs),
    "#result-shortest": summary.shortestMs === null ? "—" : formatDuration(summary.shortestMs),
    "#result-longest": summary.longestMs === null ? "—" : formatDuration(summary.longestMs),
    "#result-method": summary.method, "#result-week": String(summary.week)
  };
  Object.entries(values).forEach(([selector, value]) => { const element = document.querySelector(selector); if (element) element.textContent = value; });
}

function renderInterpretation(interpretation) {
  const general = document.querySelector("#interpretation-general");
  const mode = document.querySelector("#interpretation-mode");
  const pattern = document.querySelector("#interpretation-pattern");
  if (general) general.textContent = interpretation.general;
  if (mode) mode.textContent = interpretation.mode;
  if (pattern) {
    pattern.hidden = !interpretation.pattern;
    pattern.textContent = interpretation.pattern || "";
  }
}

function renderVisualizations(movements, timelineSelector, chartSelector) {
  const timeline = document.querySelector(timelineSelector);
  const chart = document.querySelector(chartSelector);
  if (!timeline || !chart) return;
  timeline.replaceChildren(); chart.replaceChildren();
  if (!movements.length) {
    const timelineEmpty = document.createElement("li"); timelineEmpty.className = "visual-empty"; timelineEmpty.textContent = "No se registraron movimientos."; timeline.append(timelineEmpty);
  } else {
    movements.forEach((movement) => {
      const item = document.createElement("li");
      const label = document.createElement("strong"); label.textContent = `Movimiento ${movement.number}`;
      const time = document.createElement("time"); time.dateTime = `PT${Math.floor(movement.elapsedMs / 1000)}S`; time.textContent = formatDuration(movement.elapsedMs);
      item.append(label, time); timeline.append(item);
    });
  }
  const intervals = movements.filter((movement) => movement.intervalMs !== null);
  if (!intervals.length) {
    const empty = document.createElement("p"); empty.className = "visual-empty"; empty.textContent = "Se necesitan al menos dos movimientos para mostrar intervalos."; chart.append(empty); return;
  }
  const longest = Math.max(...intervals.map((movement) => movement.intervalMs), 1);
  intervals.forEach((movement) => {
    const row = document.createElement("div"); row.className = "interval-row";
    const label = document.createElement("div"); label.className = "interval-label";
    const movementLabel = document.createElement("span"); movementLabel.textContent = `Movimiento ${movement.number} · ${formatDuration(movement.elapsedMs)}`;
    const duration = document.createElement("strong"); duration.textContent = formatDuration(movement.intervalMs);
    label.append(movementLabel, duration);
    const track = document.createElement("div"); track.className = "interval-track"; track.setAttribute("aria-hidden", "true");
    const bar = document.createElement("div"); bar.className = "interval-bar"; bar.style.setProperty("--interval-width", `${Math.max(2, movement.intervalMs / longest * 100)}%`);
    track.append(bar); row.append(label, track); chart.append(row);
  });
}

function printDocument(type) {
  if (typeof window.print !== "function") { showError("La impresión no está disponible en este navegador."); return; }
  clearError();
  const className = type === "history" ? "printing-history" : "printing-session";
  const printedAt = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date());
  document.querySelectorAll("[data-print-date]").forEach((element) => { element.textContent = printedAt; });
  document.body.classList.add(className);
  try { window.print(); }
  finally { window.setTimeout(() => document.body.classList.remove(className), 0); }
}

function formatStoredDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date);
}

function renderHistory() {
  const storage = loadStorage();
  const list = document.querySelector(SELECTORS.historyList);
  const empty = document.querySelector(SELECTORS.historyEmpty);
  const deleteAll = document.querySelector(SELECTORS.deleteAll);
  const printHistory = document.querySelector("#print-history-button");
  if (!list || !empty) return;
  const hasSessions = storage.history.length > 0;
  empty.hidden = hasSessions;
  list.hidden = !hasSessions;
  if (deleteAll) deleteAll.disabled = !hasSessions;
  if (printHistory) printHistory.disabled = !hasSessions;
  list.replaceChildren();
  if (!hasSessions) return;
  const fragment = document.createDocumentFragment();
  storage.history.forEach((session) => {
    const article = document.createElement("article");
    article.className = "history-card";
    article.dataset.sessionId = session.id;
    const heading = document.createElement("div");
    heading.className = "history-card-head";
    const title = document.createElement("h4");
    const time = document.createElement("time");
    time.dateTime = `${session.date}T${session.time}`;
    time.textContent = `${formatStoredDate(session.date)} · ${session.time}`;
    title.append(time);
    heading.append(title);
    const metrics = document.createElement("dl");
    [["Semana", session.week], ["Método", session.method], ["Movimientos", session.summary.count], ["Duración", formatDuration(session.summary.durationMs)]].forEach(([label, value]) => {
      const group = document.createElement("div");
      const term = document.createElement("dt"); term.textContent = label;
      const description = document.createElement("dd"); description.textContent = String(value);
      group.append(term, description); metrics.append(group);
    });
    const actions = document.createElement("div"); actions.className = "button-row";
    const accessibleDate = `${formatStoredDate(session.date)}, ${session.time}`;
    const detail = document.createElement("button"); detail.type = "button"; detail.dataset.action = "view-saved"; detail.dataset.sessionId = session.id; detail.textContent = "Ver detalle"; detail.setAttribute("aria-label", `Ver detalle del registro del ${accessibleDate}`);
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "button ghost"; remove.dataset.action = "delete-saved"; remove.dataset.sessionId = session.id; remove.textContent = "Eliminar"; remove.setAttribute("aria-label", `Eliminar el registro del ${accessibleDate}`);
    actions.append(detail, remove); article.append(heading, metrics, actions); fragment.append(article);
  });
  list.append(fragment);
}

function showStoredSession(id) {
  const session = loadStorage().history.find((item) => item.id === id);
  if (!session) { showError("No se ha encontrado la sesión guardada."); return; }
  const metrics = document.querySelector("#history-detail-metrics");
  const movements = document.querySelector("#history-detail-movements");
  if (!metrics || !movements) return;
  metrics.replaceChildren();
  const rows = [
    ["Fecha", formatStoredDate(session.date)], ["Hora de inicio", formatClock(new Date(session.summary.startedAt))],
    ["Hora de finalización", formatClock(new Date(session.summary.finishedAt))], ["Semana de embarazo", session.summary.week],
    ["Tipo de registro", session.summary.method], ["Percepción indicada", perceptionLabel(session.perception)], ["Movimientos registrados", session.summary.count],
    ["Duración total", formatDuration(session.summary.durationMs)], ["Tiempo hasta el décimo movimiento", session.summary.tenthMs === null ? "No alcanzado" : formatDuration(session.summary.tenthMs)],
    ["Intervalo medio", session.summary.averageMs === null ? "—" : formatDuration(session.summary.averageMs)],
    ["Intervalo más corto", session.summary.shortestMs === null ? "—" : formatDuration(session.summary.shortestMs)],
    ["Intervalo más largo", session.summary.longestMs === null ? "—" : formatDuration(session.summary.longestMs)]
  ];
  rows.forEach(([label, value]) => {
    const group = document.createElement("div"); const term = document.createElement("dt"); const description = document.createElement("dd");
    term.textContent = label; description.textContent = String(value); group.append(term, description); metrics.append(group);
  });
  movements.replaceChildren();
  if (!session.movements.length) {
    const item = document.createElement("li"); item.textContent = "No se registraron movimientos."; movements.append(item);
  } else {
    session.movements.forEach((movement) => {
      const item = document.createElement("li");
      item.textContent = `Movimiento ${movement.number} — ${formatDuration(movement.elapsedMs)}${movement.intervalMs === null ? "" : ` — intervalo: ${formatDuration(movement.intervalMs)}`}`;
      movements.append(item);
    });
  }
  const general = document.querySelector("#history-detail-general");
  const mode = document.querySelector("#history-detail-mode");
  const pattern = document.querySelector("#history-detail-pattern");
  if (general) general.textContent = session.interpretation.general;
  if (mode) mode.textContent = session.interpretation.mode;
  if (pattern) { pattern.hidden = !session.interpretation.pattern; pattern.textContent = session.interpretation.pattern || ""; }
  renderVisualizations(session.movements, "#saved-timeline", "#saved-interval-chart");
  const printSessionDate = document.querySelector("#saved-print-session-date");
  if (printSessionDate) printSessionDate.textContent = `Sesión del ${formatStoredDate(session.date)} · ${session.time}`;
  clearError();
  showScreen("history-detail");
}

function requestSessionDeletion(id, trigger) {
  if (!loadStorage().history.some((session) => session.id === id)) return;
  appState.pendingDeleteId = id;
  openDialog("delete-session-dialog", trigger);
}

function deletePendingSession() {
  if (!appState.pendingDeleteId) return;
  const storage = loadStorage();
  const history = storage.history.filter((session) => session.id !== appState.pendingDeleteId);
  if (history.length === storage.history.length) { appState.pendingDeleteId = null; return; }
  if (persistStorage({ ...storage, history }, "No ha sido posible eliminar la sesión.")) {
    appState.pendingDeleteId = null;
    renderHistory();
    document.querySelector("#screen-history")?.focus();
    announce("Sesión eliminada del historial.");
  }
}

function deleteAllHistory() {
  const storage = loadStorage();
  if (!storage.history.length) return;
  if (persistStorage({ ...storage, history: [] }, "No ha sido posible eliminar el historial.")) {
    renderHistory();
    document.querySelector("#screen-history")?.focus();
    announce("Todo el historial ha sido eliminado.");
  }
}

function recoverSession() {
  const draft = loadStorage().draft;
  if (!isValidDraft(draft)) { discardDraft(); return; }
  resetState();
  const startedAt = new Date(draft.startedAt || draft.savedAt || Date.now());
  Object.assign(appState, {
    active: true, paused: Boolean(draft.paused), sessionId: draft.sessionId,
    registrationType: draft.registrationType, pregnancyWeek: draft.pregnancyWeek,
    perception: draft.perception || null, startedAt: Number.isNaN(startedAt.getTime()) ? new Date() : startedAt,
    segmentStartedAt: draft.paused ? null : Date.now(), accumulatedMs: Math.max(0, draft.accumulatedMs),
    movements: draft.movements.map((movement, index) => ({
      number: index + 1, absoluteTime: new Date(movement.absoluteTime || draft.savedAt || Date.now()),
      elapsedMs: Math.max(0, Number(movement.elapsedMs) || 0), intervalMs: movement.intervalMs === null ? null : Math.max(0, Number(movement.intervalMs) || 0)
    })),
    objective: draft.objective || null, programmedDurationMs: Number.isFinite(draft.programmedDurationMs) ? draft.programmedDurationMs : null,
    remainingMs: Number.isFinite(draft.remainingMs) ? draft.remainingMs : null,
    targetAcknowledged: Boolean(draft.targetAcknowledged), timeAcknowledged: Boolean(draft.timeAcknowledged)
  });
  recalculateMovementData();
  renderSessionReset(); renderMovementData(); renderTimer(appState.accumulatedMs);
  document.querySelector("#recovery-dialog")?.close();
  if (appState.paused) showScreen("paused");
  else { showScreen("active", false); startTimer(); document.querySelector(SELECTORS.movementButton)?.focus(); }
  saveDraft();
  announce("Sesión recuperada.");
}

function discardDraft() {
  const storage = loadStorage();
  persistStorage({ ...storage, draft: null }, "No ha sido posible descartar la sesión temporal.");
  document.querySelector("#recovery-dialog")?.close();
  announce("Sesión interrumpida descartada.");
}

function provideMovementFeedback() {
  const button = document.querySelector(SELECTORS.movementButton);
  if (button) { button.classList.remove("is-pressed"); void button.offsetWidth; button.classList.add("is-pressed"); window.setTimeout(() => button.classList.remove("is-pressed"), 140); }
  if (typeof navigator.vibrate === "function") {
    try { navigator.vibrate(20); } catch (_error) { /* Mejora opcional sin impacto funcional. */ }
  }
}

function showError(message) {
  const element = document.querySelector(SELECTORS.errors);
  if (element) { element.textContent = message; element.hidden = false; }
}

function clearError() {
  const element = document.querySelector(SELECTORS.errors);
  if (element) { element.textContent = ""; element.hidden = true; }
}

function announce(message) {
  const element = document.querySelector(SELECTORS.status);
  if (element) element.textContent = message;
}

function openDialog(id, trigger) {
  const dialog = document.getElementById(id);
  if (!dialog || dialog.open || typeof dialog.showModal !== "function") return;
  dialog.showModal();
  if (trigger) dialog.addEventListener("close", () => { if (document.body.contains(trigger)) trigger.focus(); }, { once: true });
}

/* Eventos */
function initializeApplication() {
  const form = document.querySelector(SELECTORS.form);
  const movementButton = document.querySelector(SELECTORS.movementButton);
  form?.addEventListener("submit", startSession);
  movementButton?.addEventListener("click", registerMovement);
  document.querySelectorAll(SELECTORS.types).forEach((radio) => radio.addEventListener("change", (event) => {
    const field = document.querySelector(SELECTORS.durationField);
    if (field) field.hidden = event.target.value !== "period";
  }));
  document.addEventListener("click", handleActionClick);
  document.querySelector("[data-confirm-finish]")?.addEventListener("click", finishSession);
  document.querySelector("[data-confirm-reset]")?.addEventListener("click", () => { clearDraft(); resetState(); renderSessionReset(); showScreen("setup"); announce("Sesión reiniciada."); });
  document.querySelector("[data-target-finish]")?.addEventListener("click", finishSession);
  document.querySelector("[data-target-continue]")?.addEventListener("click", () => { document.querySelector(SELECTORS.movementButton)?.focus(); announce("Puedes continuar registrando movimientos."); });
  document.querySelector("[data-time-finish]")?.addEventListener("click", finishSession);
  document.querySelector("[data-time-continue]")?.addEventListener("click", resumeSession);
  document.querySelector("[data-confirm-delete-session]")?.addEventListener("click", deletePendingSession);
  document.querySelector("[data-confirm-delete-all]")?.addEventListener("click", deleteAllHistory);
  loadStorage();
  renderHistory();
  if (appState.storage.draft) openDialog("recovery-dialog", null);
  window.addEventListener("pagehide", () => { if (appState.active) saveDraft(); });
}

function handleActionClick(event) {
  const button = event.target.closest("button, [data-show-screen]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "undo") undoMovement();
  if (action === "pause") pauseSession();
  if (action === "resume") resumeSession();
  if (action === "save") saveCompletedSession();
  if (action === "recover") recoverSession();
  if (action === "discard") discardDraft();
  if (action === "view-saved") showStoredSession(button.dataset.sessionId);
  if (action === "delete-saved") requestSessionDeletion(button.dataset.sessionId, button);
  if (action === "print-session") printDocument("session");
  if (action === "print-history") printDocument("history");
  if (button.dataset.openDialog) openDialog(button.dataset.openDialog, button);
  if (button.dataset.showScreen) {
    if (button.dataset.showScreen === "setup") { resetState(); renderSessionReset(); }
    if (button.dataset.showScreen === "history") renderHistory();
    showScreen(button.dataset.showScreen);
  }
}

document.addEventListener("DOMContentLoaded", initializeApplication);
