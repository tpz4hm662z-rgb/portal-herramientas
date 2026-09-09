/* Atlas de sol — geometry only, no weather or thermal model.
 * Solar equations: https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 * Implementation written for Imoancy; does not contain NREL SPA code.
 * City-centre coordinates rounded to 0.01 degree are reference locations,
 * not surveyed addresses. All profiles use the 21st of each month in 2026.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SolarWindow = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const YEAR = 2026;
  const RAD = Math.PI / 180;
  const EPSILON = 1e-9;
  const STEP = 15;
  const CITIES = Object.freeze([
    ['madrid', 'Madrid', 40.42, -3.70, 'Europe/Madrid'],
    ['barcelona', 'Barcelona', 41.39, 2.17, 'Europe/Madrid'],
    ['valencia', 'Valencia', 39.47, -0.38, 'Europe/Madrid'],
    ['sevilla', 'Sevilla', 37.39, -5.99, 'Europe/Madrid'],
    ['zaragoza', 'Zaragoza', 41.65, -0.88, 'Europe/Madrid'],
    ['malaga', 'Málaga', 36.72, -4.42, 'Europe/Madrid'],
    ['murcia', 'Murcia', 37.98, -1.13, 'Europe/Madrid'],
    ['palma', 'Palma', 39.57, 2.65, 'Europe/Madrid'],
    ['las-palmas', 'Las Palmas de Gran Canaria', 28.12, -15.44, 'Atlantic/Canary'],
    ['santa-cruz', 'Santa Cruz de Tenerife', 28.46, -16.25, 'Atlantic/Canary'],
    ['bilbao', 'Bilbao', 43.26, -2.94, 'Europe/Madrid'],
    ['a-coruna', 'A Coruña', 43.36, -8.41, 'Europe/Madrid'],
    ['valladolid', 'Valladolid', 41.65, -4.73, 'Europe/Madrid'],
    ['badajoz', 'Badajoz', 38.88, -6.97, 'Europe/Madrid'],
    ['ceuta', 'Ceuta', 35.89, -5.32, 'Europe/Madrid']
  ].map(function (row) {
    return Object.freeze({ id: row[0], name: row[1], lat: row[2], lon: row[3], zone: row[4] });
  }));
  const DEFAULTS = Object.freeze({
    city: 'madrid', month: 6, minute: 840, bearingA: 180, bearingB: 270,
    roomWidth: 4, roomDepth: 4, windowWidth: 1.5, sill: 0.9,
    windowHeight: 1.3, obstruction: 0
  });
  const keys = Object.keys(DEFAULTS);
  const cityById = new Map(CITIES.map(function (city) { return [city.id, city]; }));
  const offsetCache = new Map();
  const positionCache = new Map();

  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function between(value, min, max) { return finite(value) && value >= min && value <= max; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function normalDegrees(value) { return ((value % 360) + 360) % 360; }
  function resolveCity(city) {
    const resolved = cityById.get(typeof city === 'string' ? city : city && city.id);
    if (!resolved) throw new RangeError('Ciudad de referencia desconocida.');
    return resolved;
  }

  function validateState(input) {
    const errors = [];
    const state = Object.assign({}, DEFAULTS);
    if (input !== undefined) {
      if (!input || typeof input !== 'object' || Array.isArray(input) || (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)) {
        errors.push('La configuración debe ser un objeto.');
      } else {
        Object.keys(input).forEach(function (key) {
          if (keys.indexOf(key) < 0) errors.push('Campo de configuración desconocido: ' + key + '.');
          else state[key] = input[key];
        });
      }
    }
    if (typeof state.city !== 'string' || !cityById.has(state.city)) errors.push('Elige una ciudad de la lista.');
    if (!Number.isInteger(state.month) || !between(state.month, 1, 12)) errors.push('El mes debe estar entre 1 y 12.');
    if (!Number.isInteger(state.minute) || !between(state.minute, 0, 1425) || state.minute % STEP !== 0) errors.push('La hora debe avanzar de 15 en 15 minutos, entre 00:00 y 23:45.');
    ['bearingA', 'bearingB'].forEach(function (key) {
      if (!between(state[key], 0, 359)) errors.push('La orientación debe estar entre 0 y 359 grados.');
    });
    if (!between(state.roomWidth, 2, 8)) errors.push('El ancho de la habitación debe estar entre 2 y 8 metros.');
    if (!between(state.roomDepth, 2, 8)) errors.push('El fondo de la habitación debe estar entre 2 y 8 metros.');
    if (!between(state.windowWidth, 0.5, 4) || (finite(state.roomWidth) && state.windowWidth > state.roomWidth - 0.2 + EPSILON)) errors.push('La ventana debe medir entre 0,5 y 4 metros y dejar al menos 10 cm de pared a cada lado.');
    if (!between(state.sill, 0, 1.5)) errors.push('El antepecho debe estar entre 0 y 1,5 metros del suelo.');
    if (!between(state.windowHeight, 0.4, 2.5)) errors.push('El alto de la ventana debe estar entre 0,4 y 2,5 metros.');
    if (finite(state.sill) && finite(state.windowHeight) && state.sill + state.windowHeight > 3 + EPSILON) errors.push('La parte superior de la ventana no puede superar los 3 metros.');
    if (!between(state.obstruction, 0, 60)) errors.push('El horizonte bloqueado debe estar entre 0 y 60 grados.');
    return { valid: errors.length === 0, state: Object.freeze(state), errors: errors };
  }

  function solarPosition(lat, lon, dateUTC) {
    if (!between(lat, -90, 90) || !between(lon, -180, 180)) throw new RangeError('Coordenadas solares inválidas.');
    if (!(dateUTC instanceof Date) && typeof dateUTC !== 'string') throw new RangeError('Fecha solar inválida.');
    const date = dateUTC instanceof Date ? dateUTC : new Date(dateUTC);
    if (!Number.isFinite(date.getTime())) throw new RangeError('Fecha solar inválida.');
    const year = date.getUTCFullYear();
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const day = Math.floor((Date.UTC(year, date.getUTCMonth(), date.getUTCDate()) - Date.UTC(year, 0, 1)) / 86400000) + 1;
    const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const gamma = 2 * Math.PI / (leap ? 366 : 365) * (day - 1 + (utcHour - 12) / 24);
    const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
    const solarMinutes = ((utcHour * 60 + equation + 4 * lon) % 1440 + 1440) % 1440;
    const hourAngle = (solarMinutes / 4 - 180) * RAD;
    const latitude = lat * RAD;
    const altitude = Math.asin(clamp(Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle), -1, 1)) / RAD;
    const azimuth = normalDegrees(Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(declination) * Math.cos(latitude)) / RAD + 180);
    return { altitude: altitude, azimuth: azimuth };
  }

  function utcOffset(city, month) {
    const key = city.id + ':' + month;
    if (offsetCache.has(key)) return offsetCache.get(key);
    // The 21st does not cross a Spanish DST transition in the reference year.
    const noon = new Date(Date.UTC(YEAR, month - 1, 21, 12));
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: city.zone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(noon);
    const values = {};
    parts.forEach(function (part) { if (part.type !== 'literal') values[part.type] = Number(part.value); });
    const offset = (Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second) - noon.getTime()) / 60000;
    offsetCache.set(key, offset);
    return offset;
  }

  function localDate(city, month, minute) {
    const location = resolveCity(city);
    if (!Number.isInteger(month) || !between(month, 1, 12) || !Number.isInteger(minute) || minute < 0 || minute > 1440) throw new RangeError('Mes u hora local inválidos.');
    return new Date(Date.UTC(YEAR, month - 1, 21, 0, minute) - utcOffset(location, month) * 60000);
  }

  function clipPolygon(polygon, axis, bound, greater) {
    if (!polygon.length) return [];
    const out = [];
    const inside = function (point) { return greater ? point[axis] >= bound : point[axis] <= bound; };
    let previous = polygon[polygon.length - 1];
    let previousInside = inside(previous);
    polygon.forEach(function (point) {
      const pointInside = inside(point);
      if (pointInside !== previousInside) {
        const ratio = (bound - previous[axis]) / (point[axis] - previous[axis]);
        const intersection = [previous[0] + ratio * (point[0] - previous[0]), previous[1] + ratio * (point[1] - previous[1])];
        intersection[axis] = bound;
        out.push(intersection);
      }
      if (pointInside) out.push(point);
      previous = point;
      previousInside = pointInside;
    });
    return out;
  }

  function projectWindow(sun, bearing, geometry, obstruction) {
    const horizon = obstruction === undefined ? 0 : obstruction;
    if (!sun || !between(sun.altitude, -90, 90) || !between(sun.azimuth, 0, 360) || !between(bearing, 0, 359) || !between(horizon, 0, 60)) throw new RangeError('Posición solar u orientación inválida.');
    if (!geometry || !between(geometry.roomWidth, 2, 8) || !between(geometry.roomDepth, 2, 8) || !between(geometry.windowWidth, 0.5, 4) || geometry.windowWidth > geometry.roomWidth - 0.2 + EPSILON || !between(geometry.sill, 0, 1.5) || !between(geometry.windowHeight, 0.4, 2.5) || geometry.sill + geometry.windowHeight > 3 + EPSILON) throw new RangeError('Geometría de habitación inválida.');
    const empty = function (status, facing) { return { facing: facing, lit: false, polygon: [], area: 0, depth: 0, status: status }; };
    if (sun.altitude <= 0) return empty('night', false);
    const delta = (sun.azimuth - bearing) * RAD;
    const forward = Math.cos(delta);
    if (forward <= EPSILON) return empty('behind', false);
    if (sun.altitude <= horizon) return empty('obstructed', true);
    const slope = Math.tan(sun.altitude * RAD);
    const side = -Math.sin(delta) / slope;
    const inward = forward / slope;
    const half = geometry.windowWidth / 2;
    const bottom = geometry.sill;
    const top = bottom + geometry.windowHeight;
    let polygon = [[-half, bottom], [half, bottom], [half, top], [-half, top]].map(function (corner) {
      return [corner[0] + corner[1] * side, corner[1] * inward];
    });
    polygon = clipPolygon(polygon, 0, -geometry.roomWidth / 2, true);
    polygon = clipPolygon(polygon, 0, geometry.roomWidth / 2, false);
    polygon = clipPolygon(polygon, 1, 0, true);
    polygon = clipPolygon(polygon, 1, geometry.roomDepth, false);
    let twiceArea = 0;
    polygon.forEach(function (point, index) {
      const next = polygon[(index + 1) % polygon.length];
      twiceArea += point[0] * next[1] - next[0] * point[1];
    });
    const area = Math.abs(twiceArea) / 2;
    if (area <= EPSILON) return empty('wall', true);
    const depth = Math.max.apply(null, polygon.map(function (point) { return point[1]; }));
    return { facing: true, lit: true, polygon: polygon, area: area, depth: depth, status: 'floor' };
  }

  function positions(city, month) {
    const key = city.id + ':' + month;
    if (!positionCache.has(key)) {
      const rows = [];
      for (let minute = 0; minute < 1440; minute += STEP) {
        rows.push(Object.freeze(solarPosition(city.lat, city.lon, localDate(city, month, minute))));
      }
      positionCache.set(key, Object.freeze(rows));
    }
    return positionCache.get(key);
  }

  function collectIntervals(samples, predicate) {
    const intervals = [];
    let start = null;
    samples.forEach(function (sample) {
      if (predicate(sample)) {
        if (start === null) start = sample.minute;
      } else if (start !== null) {
        intervals.push({ start: start, end: sample.minute });
        start = null;
      }
    });
    if (start !== null) intervals.push({ start: start, end: 1440 });
    return intervals;
  }

  function daySummary(input, bearing, month) {
    const checked = validateState(input);
    if (!checked.valid) throw new RangeError(checked.errors.join(' '));
    const state = checked.state;
    const selectedMonth = month === undefined ? state.month : month;
    if (!between(bearing, 0, 359) || !Number.isInteger(selectedMonth) || !between(selectedMonth, 1, 12)) throw new RangeError('Mes u orientación inválidos.');
    const city = resolveCity(state.city);
    let peakDepth = 0;
    const samples = positions(city, selectedMonth).map(function (sun, index) {
      const projected = projectWindow(sun, bearing, state, state.obstruction);
      peakDepth = Math.max(peakDepth, projected.depth);
      return { minute: index * STEP, altitude: sun.altitude, azimuth: sun.azimuth, facing: projected.facing, lit: projected.lit, status: projected.status };
    });
    const intervals = collectIntervals(samples, function (sample) { return sample.status === 'wall' || sample.status === 'floor'; });
    const floorIntervals = collectIntervals(samples, function (sample) { return sample.lit; });
    const duration = function (rows) { return rows.reduce(function (sum, interval) { return sum + interval.end - interval.start; }, 0); };
    return { facadeMinutes: duration(intervals), floorMinutes: duration(floorIntervals), intervals: intervals, floorIntervals: floorIntervals, peakDepth: peakDepth, samples: samples };
  }

  function profileAnnual(state, bearing) {
    const result = [];
    for (let month = 1; month <= 12; month += 1) {
      const day = daySummary(state, bearing, month);
      result.push({ month: month, facadeMinutes: day.facadeMinutes, floorMinutes: day.floorMinutes, intervals: day.intervals, floorIntervals: day.floorIntervals, peakDepth: day.peakDepth });
    }
    return result;
  }

  function calculate(input) {
    const checked = validateState(input);
    if (!checked.valid) return { valid: false, state: checked.state, errors: checked.errors };
    const state = checked.state;
    const city = resolveCity(state.city);
    const sun = solarPosition(city.lat, city.lon, localDate(city, state.month, state.minute));
    return {
      valid: true, state: state, errors: [], sun: sun,
      a: Object.assign({}, projectWindow(sun, state.bearingA, state, state.obstruction), daySummary(state, state.bearingA)),
      b: Object.assign({}, projectWindow(sun, state.bearingB, state, state.obstruction), daySummary(state, state.bearingB)),
      annualA: profileAnnual(state, state.bearingA), annualB: profileAnnual(state, state.bearingB)
    };
  }

  return Object.freeze({ YEAR: YEAR, CITIES: CITIES, DEFAULTS: DEFAULTS, validateState: validateState, solarPosition: solarPosition, localDate: localDate, projectWindow: projectWindow, daySummary: daySummary, profileAnnual: profileAnnual, calculate: calculate });
}));
