(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const core = window.CurtainCalculator;
  const form = $('curtain-form');
  if (!core) {
    $('form-error').textContent = 'No se ha podido cargar la calculadora. Recarga la página o consulta las fórmulas y el ejemplo resuelto más abajo.';
    $('form-error').hidden = false;
    form.querySelector('button[type="submit"]').disabled = true;
    form.addEventListener('submit', event => event.preventDefault());
    return;
  }
  const canonical = 'https://imoancy.com/herramientas/calculadora-tela-cortinas/';
  const format = (value, decimals = 2) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: decimals }).format(value);
  const meters = value => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' m';
  const euros = value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  let lastResult = null;
  let started = false;
  let analyticsAllowed = false;
  let analyticsLoaded = false;
  const measurementId = 'G-QH8MJ6LVHN';
  const consentKey = 'imoancy_curtain_analytics';

  // Optional GA4: load only after permission; never send entered measurements,
  // prices, calculated quantities, clipboard text or form content.
  function track(event, params = {}) {
    if (!analyticsAllowed || typeof window.gtag !== 'function') return;
    window.gtag('event', event, { tool_id: 'tela_cortinas', ...params });
  }
  function setAnalytics(allowed, persist) {
    analyticsAllowed = allowed;
    window['ga-disable-' + measurementId] = !allowed;
    if (persist) {
      try { localStorage.setItem(consentKey, allowed ? 'granted' : 'denied'); } catch (_) { /* The choice still applies for this visit. */ }
    }
    if (allowed && !analyticsLoaded) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      window.gtag('js', new Date());
      window.gtag('config', measurementId, { page_location: canonical, page_title: document.title, allow_google_signals: false, allow_ad_personalization_signals: false });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
      document.head.append(script);
      analyticsLoaded = true;
    } else if (analyticsLoaded) {
      window.gtag('consent', 'update', { analytics_storage: allowed ? 'granted' : 'denied' });
    }
    $('analytics-status').textContent = allowed ? 'Medición activada. Puedes desactivarla aquí en cualquier momento.' : 'Medición desactivada.';
    $('analytics-allow').setAttribute('aria-pressed', String(allowed));
    $('analytics-deny').setAttribute('aria-pressed', String(!allowed));
    $('analytics-deny').textContent = allowed ? 'Desactivar medición' : 'Mantener desactivada';
  }
  $('analytics-allow').addEventListener('click', () => setAnalytics(true, true));
  $('analytics-deny').addEventListener('click', () => setAnalytics(false, true));
  let savedConsent = false;
  try { savedConsent = localStorage.getItem(consentKey) === 'granted'; } catch (_) { /* Storage is optional. */ }
  setAnalytics(savedConsent, false);

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function numericValue(field) {
    const value = field.value.trim();
    if (field.id === 'pricePerMeter' && value === '') return 0;
    // Accept either decimal separator, but never infer thousands or parse a
    // partial string such as "200cm", "1,2,3", scientific notation or HTML.
    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value)) {
      throw new core.ValidationError(field.id, 'Introduce un número válido, sin unidades ni separadores de miles. Puedes usar coma o punto decimal.', 'invalid_number');
    }
    return Number(value.replace(',', '.'));
  }
  function readInput() {
    const input = {};
    Object.keys(core.defaults).forEach(key => {
      const field = $(key);
      if (typeof core.defaults[key] === 'string') input[key] = field.value;
      else if (key === 'repeat' && $('pattern').value === 'plain') input[key] = 0;
      else if (key === 'seamAllowance' && $('orientation').value === 'railroaded') input[key] = core.defaults.seamAllowance;
      else input[key] = numericValue(field);
    });
    return input;
  }
  function clearError() {
    $('form-error').hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(field => {
      field.removeAttribute('aria-invalid');
      const ids = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== 'form-error');
      if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
      else field.removeAttribute('aria-describedby');
    });
  }
  function showError(error) {
    $('form-error').textContent = error instanceof core.ValidationError ? error.message : 'No hemos podido calcular el resultado. Revisa los datos e inténtalo de nuevo.';
    $('form-error').hidden = false;
    const field = $(error.field);
    if (field && form.contains(field)) {
      if (field.closest('details')) field.closest('details').open = true;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', ((field.getAttribute('aria-describedby') || '') + ' form-error').trim());
      field.focus();
    }
    track('curtain_error', { error_code: error instanceof core.ValidationError ? error.code : 'unexpected' });
  }
  function updateConditionalFields() {
    $('repeat-field').hidden = $('pattern').value === 'plain';
    $('repeat').disabled = $('pattern').value === 'plain';
    // Keep the stored seam allowance editable so switching orientation retains it.
    $('seam-field').hidden = $('orientation').value === 'railroaded';
  }
  function markDirty() {
    if (!started) { track('curtain_start'); started = true; }
    lastResult = null;
    $('result').hidden = true;
    $('comparison').hidden = true;
    $('stale-message').hidden = false;
    $('calculation-status').textContent = 'Medidas modificadas. Pulsa Calcular metros de tela para actualizar.';
    clearError();
    updateConditionalFields();
  }
  form.addEventListener('input', markDirty);
  form.addEventListener('change', markDirty);

  function drawDiagram(result) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 420 240');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-labelledby', 'diagram-title diagram-description');
    function add(tag, attrs, text) {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, val]) => node.setAttribute(key, String(val)));
      if (text) node.textContent = text;
      svg.append(node);
      return node;
    }
    const wide = result.input.orientation === 'railroaded';
    add('title', { id: 'diagram-title' }, wide ? 'Cortes con el ancho del rollo como altura' : 'Tiras con el largo del rollo como altura');
    add('desc', { id: 'diagram-description' }, wide ? `${result.input.panels} piezas consecutivas a lo largo del rollo. Cada una consume ${format(result.cutWidthPerPanel)} cm del rollo.` : `${result.totalDrops} tiras completas de ${format(result.dropLength)} cm a lo largo del rollo. Se unen ${result.dropsPerPanel} tiras por hoja.`);
    add('rect', { x: 56, y: 52, width: 308, height: 126, rx: 4, fill: '#e1eee4', stroke: '#719781', 'stroke-width': 1.5 });
    if (wide) {
      if (result.input.panels === 2) add('line', { x1: 210, y1: 52, x2: 210, y2: 178, stroke: '#307558', 'stroke-width': 2, 'stroke-dasharray': '6 5' });
      for (let panel = 0; panel < result.input.panels; panel++) {
        const x = result.input.panels === 1 ? 210 : 133 + panel * 154;
        add('text', { x, y: 106, fill: '#205944', 'font-size': 13, 'text-anchor': 'middle' }, `Hoja ${panel + 1}`);
        add('text', { x, y: 127, fill: '#385d4d', 'font-size': 11, 'text-anchor': 'middle' }, `${format(result.cutWidthPerPanel)} cm de rollo`);
      }
      add('text', { x: 210, y: 30, fill: '#52616b', 'font-size': 12, 'text-anchor': 'middle' }, `Altura útil disponible: ${format(result.usableFabricWidth)} cm`);
      add('line', { x1: 56, y1: 197, x2: 364, y2: 197, stroke: '#52616b' });
      add('path', { d: 'M358 193 L364 197 L358 201', fill: 'none', stroke: '#52616b' });
      add('text', { x: 210, y: 220, fill: '#52616b', 'font-size': 12, 'text-anchor': 'middle' }, `Largo del rollo → ${meters(result.baseMeters)} para las piezas`);
    } else {
      const shown = Math.min(result.totalDrops, 4);
      for (let index = 1; index < shown; index++) add('line', { x1: 56 + 308 * index / shown, y1: 52, x2: 56 + 308 * index / shown, y2: 178, stroke: '#307558', 'stroke-width': 2, 'stroke-dasharray': '6 5' });
      for (let index = 0; index < shown; index++) add('text', { x: 56 + 308 * (index + .5) / shown, y: 115, fill: '#205944', 'font-size': 12, 'text-anchor': 'middle' }, `Tira ${index + 1}`);
      add('text', { x: 210, y: 30, fill: '#52616b', 'font-size': 12, 'text-anchor': 'middle' }, `Cada tira: ${format(result.dropLength)} cm a lo largo del rollo`);
      add('text', { x: 210, y: 205, fill: '#52616b', 'font-size': 12, 'text-anchor': 'middle' }, `Ancho del rollo: ${format(result.input.fabricWidth)} cm`);
      add('text', { x: 210, y: 225, fill: '#52616b', 'font-size': 11, 'text-anchor': 'middle' }, `Largo del rollo → ${result.totalDrops} tiras en total${result.totalDrops > shown ? ' (se muestran 4)' : ''}`);
    }
    $('cut-diagram').replaceChildren(svg);
  }

  function stepsFor(result) {
    const d = result.input;
    const steps = [
      `Cada hoja cubre ${format(result.finishedCoveragePerPanel)} cm del riel: ${format(d.trackWidth)} × ${format(d.fullness)} ÷ ${d.panels} = ${format(result.finishedWidthPerPanel)} cm de tela plana por hoja.`,
      `Altura con reservas: ${format(d.finishedHeight)} + ${format(d.topAllowance)} + ${format(d.bottomAllowance)} = ${format(result.cutHeight)} cm.`,
      `Ancho útil: (${format(d.fabricWidth)} − 2 × ${format(d.selvage)}) × ${format(result.shrinkFactor, 4)} = ${format(result.usableFabricWidth)} cm.`
    ];
    if (d.orientation === 'railroaded') {
      steps.push(`La altura de ${format(result.cutHeight)} cm cabe en los ${format(result.usableFabricWidth)} cm útiles del rollo.`);
      steps.push(`Por hoja: (${format(result.finishedWidthPerPanel)} + 2 × ${format(d.sideAllowance)}) ÷ ${format(result.shrinkFactor, 4)} = ${format(result.cutWidthPerPanel)} cm a lo largo del rollo. Total: ${meters(result.baseMeters)}.`);
    } else {
      steps.push(`${result.dropsPerPanel} tiras por hoja dejan ${format(result.availableWidthPerPanel)} cm planos útiles tras descontar los laterales y ${result.seamsPerPanel} unión(es) de ${format(d.seamAllowance * 2)} cm. Necesitas al menos ${format(result.finishedWidthPerPanel)} cm.`);
      steps.push(`Largo antes de encoger: ${format(result.cutHeight)} ÷ ${format(result.shrinkFactor, 4)} = ${format(result.rawDropLength)} cm.${d.pattern === 'straight' ? ` Se redondea a ${format(result.dropLength)} cm para el rapport de ${format(d.repeat)} cm.` : ''}`);
      steps.push(`${result.totalDrops} tiras × ${format(result.dropLength)} cm${result.initialPatternReserveCm ? ` + ${format(result.initialPatternReserveCm)} cm para alinear el primer motivo` : ''} = ${meters(result.baseMeters)}.`);
    }
    return steps;
  }
  function cutDescription(result) {
    return result.input.orientation === 'railroaded'
      ? `${format(result.cutWidthPerPanel)} cm de largo de rollo × ${format(result.input.fabricWidth)} cm de ancho`
      : `${format(result.dropLength)} cm de largo de rollo × ${format(result.input.fabricWidth)} cm de ancho`;
  }
  function render(result, userAction) {
    const d = result.input;
    $('result-kind').textContent = userAction ? 'Resultado con tus medidas' : 'Ejemplo con las medidas iniciales';
    $('purchase-meters').textContent = meters(result.purchaseMeters).replace(' m', '');
    $('purchase-context').textContent = `Tela de ${format(d.fabricWidth)} cm de ancho · ${d.orientation === 'railroaded' ? 'a doble ancho' : 'por tiras'} · compra cada ${format(d.purchaseStep * 100)} cm`;
    $('cut-count').textContent = `${result.totalDrops} ${d.orientation === 'railroaded' ? 'pieza(s)' : 'tira(s)'} / ${d.panels} hoja(s)`;
    $('fabric-cost').textContent = d.pricePerMeter > 0 ? euros(result.cost) : 'Añade precio para calcular';
    drawDiagram(result);
    const list = [];
    for (let panel = 1; panel <= d.panels; panel++) {
      const row = element('tr');
      const heading = element('th', `Hoja ${panel}`);
      heading.scope = 'row';
      row.append(heading, element('td', String(result.dropsPerPanel)), element('td', cutDescription(result)));
      list.push(row);
    }
    $('cut-list').replaceChildren(...list);
    $('cut-caption').textContent = `Esquema de reparto, sin escala. Las medidas de la tabla son reservas antes del prelavado: retira los orillos y prepara la altura de ${format(result.cutHeight)} cm después de encoger.${d.pattern === 'straight' ? ` Reserva además ${format(result.initialPatternReserveCm)} cm al principio del rollo y alinea el dibujo antes de marcar la altura.` : ''}${d.orientation === 'vertical' ? ` Una vez unidas las tiras, ajusta cada hoja a ${format(result.finishedWidthPerPanel + 2 * d.sideAllowance)} cm de ancho antes de doblar los laterales.` : ''}`;
    $('calculation-steps').replaceChildren(...stepsFor(result).map(step => element('li', step)));
    const totals = [
      ['Tela para cortes y casado', result.baseMeters],
      [`Reserva adicional (${format(d.reservePercent)} %)`, result.reserveMeters],
      ['Redondeo de la tienda', result.roundingMeters],
      ['Total que comprar', result.purchaseMeters]
    ];
    $('purchase-breakdown').replaceChildren(...totals.map(([label, value]) => {
      const row = element('div'); row.append(element('dt', label), element('dd', meters(value))); return row;
    }));
    $('result-warnings').replaceChildren(...result.warnings.map(warning => element('li', warning)));
    $('copy-status').textContent = '';
    $('copy-fallback').hidden = true;
    $('result').hidden = false;
    $('stale-message').hidden = true;
    renderComparison(d);
    $('calculation-status').textContent = `${userAction ? 'Resultado' : 'Ejemplo'}: ${meters(result.purchaseMeters)} de tela. ${result.totalDrops} cortes para ${d.panels} hojas.`;
  }
  function renderComparison(input) {
    const options = [{ width: 140, orientation: 'vertical' }, { width: 280, orientation: 'railroaded' }, { width: 300, orientation: 'railroaded' }];
    $('comparison-results').replaceChildren(...options.map(option => {
      const card = element('div', undefined, 'comparison-option');
      card.append(element('h3', `Tela de ${option.width} cm`), element('p', option.orientation === 'vertical' ? 'Por tiras verticales' : 'A doble ancho, si el tejido lo permite'));
      try {
        const candidate = core.calculate({ ...input, fabricWidth: option.width, orientation: option.orientation });
        card.append(element('strong', meters(candidate.purchaseMeters)));
        const button = element('button', 'Usar este formato');
        button.type = 'button';
        button.setAttribute('aria-label', `Usar tela de ${option.width} cm ${option.orientation === 'vertical' ? 'por tiras' : 'a doble ancho'}`);
        button.addEventListener('click', () => {
          $('fabricWidth').value = option.width;
          $('orientation').value = option.orientation;
          // Each material has its own price: do not silently reuse another quote.
          $('pricePerMeter').value = '';
          updateConditionalFields();
          calculate(true);
          track('curtain_compare', { orientation: option.orientation });
        });
        card.append(button);
      } catch (error) {
        card.append(element('p', error.code === 'height_does_not_fit' ? 'La altura con reservas no cabe.' : 'Este formato requiere revisar el casado.', 'unavailable'));
      }
      return card;
    }));
    $('comparison').hidden = false;
  }
  function calculate(userAction) {
    clearError();
    lastResult = null;
    $('result').hidden = true;
    $('comparison').hidden = true;
    try {
      const result = core.calculate(readInput());
      lastResult = result;
      render(result, userAction);
      if (userAction) {
        if (!started) { track('curtain_start'); started = true; }
        track('curtain_calculate', { orientation: result.input.orientation, pattern: result.input.pattern });
        $('result-heading').focus({ preventScroll: true });
        if (window.matchMedia('(max-width: 800px)').matches) $('result').scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    } catch (error) { showError(error); }
  }
  form.addEventListener('submit', event => { event.preventDefault(); calculate(true); });
  form.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    const data = { ...core.defaults };
    if (button.dataset.preset !== 'wide') Object.assign(data, { fabricWidth: 140, orientation: 'vertical' });
    if (button.dataset.preset === 'pattern') Object.assign(data, { pattern: 'straight', repeat: 64 });
    Object.keys(data).forEach(key => { $(key).value = key === 'pricePerMeter' ? '' : data[key]; });
    $('advanced').open = button.dataset.preset === 'pattern';
    updateConditionalFields();
    calculate(true);
    $('result-kind').textContent = 'Ejemplo cargado · puedes modificar las medidas';
    track('curtain_example', { example: button.dataset.preset });
  }));

  function summary(result) {
    const d = result.input;
    return [
      'IMOANCY · Tela para cortinas', canonical,
      `COMPRA: ${meters(result.purchaseMeters)} de tela de ${format(d.fabricWidth)} cm de ancho.`,
      `Modo: ${d.orientation === 'railroaded' ? 'doble ancho (confirmar con fabricante)' : 'tiras verticales'}.`,
      `Riel: ${format(d.trackWidth)} cm. Alto terminado: ${format(d.finishedHeight)} cm. Fruncido: ${format(d.fullness)}. Hojas: ${d.panels}.`,
      `Reservas: superior ${format(d.topAllowance)}, bajo ${format(d.bottomAllowance)}, cada lateral ${format(d.sideAllowance)}, cada borde de unión ${format(d.seamAllowance)}, cada orillo ${format(d.selvage)} cm.`,
      `Dibujo: ${d.pattern === 'plain' ? 'sin casado' : 'case recto, rapport ' + format(d.repeat) + ' cm'}. Encogimiento en ambos sentidos: ${format(d.shrinkage)} %.`,
      `CORTES: ${result.dropsPerPanel} por hoja; ${result.totalDrops} en total de ${cutDescription(result)}.`,
      $('cut-caption').textContent,
      ...stepsFor(result),
      `Base: ${meters(result.baseMeters)}. Reserva ${format(d.reservePercent)} %: ${meters(result.reserveMeters)}. Redondeo: ${meters(result.roundingMeters)}. Incremento de venta: ${format(d.purchaseStep * 100)} cm.`,
      d.pricePerMeter > 0 ? `Coste solo tela: ${euros(result.cost)} a ${euros(d.pricePerMeter)}/m. No incluye confección, riel ni envío.` : 'Precio no indicado.',
      ...result.warnings,
      'Estimación de compra; verifica el tejido y el casado antes de cortar.'
    ].join('\n');
  }
  $('copy-result').addEventListener('click', async () => {
    if (!lastResult) return;
    const text = summary(lastResult);
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard_unavailable');
      await navigator.clipboard.writeText(text);
      $('copy-status').textContent = 'Resumen copiado con medidas, cortes y reservas.';
    } catch (_) {
      $('copy-fallback').hidden = false;
      $('summary-text').value = text;
      $('summary-text').focus();
      $('summary-text').select();
      $('copy-status').textContent = 'Tu navegador no permite copiar automáticamente. Copia el texto seleccionado.';
    }
    track('curtain_export', { format: 'copy' });
  });
  $('print-result').addEventListener('click', () => {
    if (!lastResult) return;
    $('result').querySelector('.breakdown').open = true;
    track('curtain_export', { format: 'print' });
    window.print();
  });
  updateConditionalFields();
  calculate(false);
}());
