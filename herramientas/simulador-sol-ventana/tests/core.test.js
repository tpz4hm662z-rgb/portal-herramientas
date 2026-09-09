'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('../js/core.js');
const geometry = core.DEFAULTS;
function close(actual, expected, tolerance = 1e-8) { assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected} ± ${tolerance}`); }
function state(patch) { return Object.assign({}, core.DEFAULTS, patch); }

test('UMD works without a DOM and exports the same browser contract', () => {
  const context = vm.createContext({ Intl, Date });
  vm.runInContext(fs.readFileSync(require.resolve('../js/core.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context.SolarWindow), Object.keys(core));
  assert.equal(context.SolarWindow.calculate().valid, true);
});

test('defaults and city references are immutable and use a fixed representative year', () => {
  assert.equal(core.YEAR, 2026);
  assert.ok(Object.isFrozen(core.DEFAULTS));
  assert.ok(Object.isFrozen(core.CITIES));
  assert.ok(core.CITIES.every(Object.isFrozen));
  assert.equal(new Set(core.CITIES.map(city => city.id)).size, core.CITIES.length);
  assert.ok(core.CITIES.length >= 15);
  assert.equal(core.validateState().valid, true);
  assert.deepEqual(core.validateState({}).state, core.DEFAULTS);
});

const invalidCases = [
  null, [], 'madrid', new Date(), new Map(), { city: 'london' }, { extra: 1 },
  { month: 0 }, { month: 13 }, { month: 1.5 }, { month: '6' },
  { minute: -15 }, { minute: 1440 }, { minute: 841 }, { minute: '840' },
  { bearingA: -1 }, { bearingB: 360 }, { bearingA: NaN }, { bearingB: Infinity },
  { roomWidth: 1.99 }, { roomWidth: 8.01 }, { roomDepth: -1 }, { roomDepth: Infinity },
  { windowWidth: 0.49 }, { windowWidth: 4.1 }, { roomWidth: 2, windowWidth: 1.81 },
  { sill: -0.1 }, { sill: 1.51 }, { windowHeight: 0.39 }, { windowHeight: 2.51 },
  { sill: 1, windowHeight: 2.1 }, { obstruction: -1 }, { obstruction: 61 }, { obstruction: NaN }
];
invalidCases.forEach((input, index) => test(`reject invalid state ${index + 1}`, () => {
  const checked = core.validateState(input);
  assert.equal(checked.valid, false);
  assert.ok(checked.errors.length > 0);
  assert.equal(core.calculate(input).valid, false);
}));

test('strict numeric types apply to every numeric field', () => {
  for (const [key, value] of Object.entries(core.DEFAULTS)) {
    if (typeof value !== 'number') continue;
    for (const invalid of [String(value), null, true, undefined, NaN, Infinity, -Infinity]) {
      assert.equal(core.validateState({ [key]: invalid }).valid, false, key);
    }
  }
});

test('valid boundary geometries and continuous bearings are accepted', () => {
  assert.equal(core.validateState(state({ roomWidth: 2, roomDepth: 2, windowWidth: 1.8, sill: 1.5, windowHeight: 1.5, obstruction: 60, bearingA: 359, bearingB: 0 })).valid, true);
  assert.equal(core.validateState(state({ roomWidth: 8, roomDepth: 8, windowWidth: 4, sill: 0, windowHeight: 2.5, bearingA: 179.5 })).valid, true);
});

test('NOAA approximation matches independent NREL published example within 0.6 degrees', () => {
  // NREL/TP-560-34302, example input/output table. Geometric zenith 50.127954°;
  // apparent zenith 50.111622° includes refraction and is not our model.
  const sun = core.solarPosition(39.742476, -105.1786, new Date('2003-10-17T19:30:30Z'));
  close(sun.altitude, 90 - 50.127954, 0.6);
  close(sun.azimuth, 194.340241, 0.6);
});

test('solar positions are geometric and finite at horizon, poles and leap dates', () => {
  for (const lat of [-90, -66, 0, 40, 66, 90]) {
    for (const date of ['2024-02-29T00:00:00Z', '2026-03-21T12:00:00Z', '2026-06-21T00:00:00Z', '2026-12-21T12:00:00Z']) {
      const sun = core.solarPosition(lat, 0, date);
      assert.ok(Number.isFinite(sun.altitude) && sun.altitude >= -90 && sun.altitude <= 90);
      assert.ok(Number.isFinite(sun.azimuth) && sun.azimuth >= 0 && sun.azimuth < 360);
    }
  }
  assert.throws(() => core.solarPosition(NaN, 0, new Date()), RangeError);
  assert.throws(() => core.solarPosition(0, 181, new Date()), RangeError);
  assert.throws(() => core.solarPosition(0, 0, 'invalid'), RangeError);
  assert.throws(() => core.solarPosition(0, 0, null), RangeError);
  assert.throws(() => core.localDate('madrid', 6, 10.5), RangeError);
});

test('Spanish civil times handle winter, summer and Canary Islands correctly', () => {
  assert.equal(core.localDate('madrid', 1, 840).toISOString(), '2026-01-21T13:00:00.000Z');
  assert.equal(core.localDate('madrid', 6, 840).toISOString(), '2026-06-21T12:00:00.000Z');
  assert.equal(core.localDate('santa-cruz', 1, 840).toISOString(), '2026-01-21T14:00:00.000Z');
  assert.equal(core.localDate('santa-cruz', 6, 840).toISOString(), '2026-06-21T13:00:00.000Z');
  assert.equal(core.localDate('ceuta', 6, 0).toISOString(), '2026-06-20T22:00:00.000Z');
  assert.equal(core.localDate('madrid', 3, 720).getUTCHours(), 11);
  assert.equal(core.localDate('madrid', 4, 720).getUTCHours(), 10);
  assert.equal(core.localDate('madrid', 10, 720).getUTCHours(), 10);
  assert.equal(core.localDate('madrid', 11, 720).getUTCHours(), 11);
});

test('all city/month dates round-trip to the selected local day and clock', () => {
  for (const city of core.CITIES) for (let month = 1; month <= 12; month++) {
    for (const minute of [0, 720, 1425]) {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: city.zone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(core.localDate(city, month, minute));
      const parsed = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
      assert.equal(parsed.year, 2026);
      assert.equal(parsed.month, month);
      assert.equal(parsed.day, 21);
      assert.equal(parsed.hour * 60 + parsed.minute, minute);
    }
  }
});

test('front-facing 45-degree sunlight has an analytically known rectangular projection', () => {
  const p = core.projectWindow({ altitude: 45, azimuth: 180 }, 180, geometry);
  assert.equal(p.status, 'floor');
  close(p.area, 1.95);
  close(p.depth, 2.2);
  const expected = [[-0.75, 0.9], [0.75, 0.9], [0.75, 2.2], [-0.75, 2.2]];
  p.polygon.forEach((point, i) => point.forEach((coordinate, axis) => close(coordinate, expected[i][axis])));
});

test('oblique rays move left or right without mirroring the inside viewpoint', () => {
  const right = core.projectWindow({ altitude: 45, azimuth: 210 }, 180, state({ roomWidth: 8 }));
  const left = core.projectWindow({ altitude: 45, azimuth: 150 }, 180, state({ roomWidth: 8 }));
  close(right.area, left.area);
  close(right.depth, left.depth);
  assert.ok(right.polygon.reduce((sum, point) => sum + point[0], 0) < 0);
  assert.ok(left.polygon.reduce((sum, point) => sum + point[0], 0) > 0);
});

test('room clipping changes area and caps reach at the actual floor', () => {
  const p = core.projectWindow({ altitude: 45, azimuth: 180 }, 180, state({ roomDepth: 2 }));
  close(p.area, 1.65);
  close(p.depth, 2);
  const sideClipped = core.projectWindow({ altitude: 30, azimuth: 210 }, 180, state({ roomWidth: 2, windowWidth: 1.8 }));
  assert.ok(sideClipped.lit);
  assert.ok(sideClipped.polygon.every(point => point[0] >= -1 && point[0] <= 1));
});

test('sun can face a window yet hit a wall instead of its floor', () => {
  const p = core.projectWindow({ altitude: 5, azimuth: 180 }, 180, geometry);
  assert.equal(p.facing, true);
  assert.equal(p.lit, false);
  assert.equal(p.status, 'wall');
  assert.equal(p.depth, 0);
  assert.equal(p.area, 0);
  assert.deepEqual(p.polygon, []);
});

test('night, rear-facing, grazing and blocked rays have no sunlit floor', () => {
  for (const [sun, obstruction, status] of [
    [{ altitude: -1, azimuth: 180 }, 0, 'night'],
    [{ altitude: 0, azimuth: 180 }, 0, 'night'],
    [{ altitude: 45, azimuth: 0 }, 0, 'behind'],
    [{ altitude: 45, azimuth: 90 }, 0, 'behind'],
    [{ altitude: 30, azimuth: 180 }, 30, 'obstructed'],
    [{ altitude: 20, azimuth: 180 }, 60, 'obstructed']
  ]) {
    const p = core.projectWindow(sun, 180, geometry, obstruction);
    assert.equal(p.status, status);
    assert.equal(p.lit, false);
    assert.equal(p.area, 0);
    assert.equal(p.depth, 0);
    assert.deepEqual(p.polygon, []);
  }
  assert.equal(core.projectWindow({ altitude: 30.1, azimuth: 180 }, 180, geometry, 30).lit, true);
});

test('zenith and almost-horizontal rays remain finite', () => {
  for (const altitude of [0.00000001, 0.001, 89.999999, 90]) {
    const p = core.projectWindow({ altitude, azimuth: 180 }, 180, geometry);
    assert.ok(Number.isFinite(p.area));
    assert.ok(Number.isFinite(p.depth));
    assert.ok(p.polygon.flat().every(Number.isFinite));
  }
});

test('blocked horizon is uniform and does not fabricate a building outline', () => {
  const open = core.daySummary(geometry, 180, 12);
  const blocked = core.daySummary(state({ obstruction: 60 }), 180, 12);
  assert.ok(open.facadeMinutes > 0);
  assert.equal(blocked.facadeMinutes, 0);
  assert.equal(blocked.floorMinutes, 0);
  assert.ok(blocked.samples.some(sample => sample.status === 'obstructed' && sample.facing));
});

test('northern window in Spanish summer has two disjoint sun intervals, not all-day sun', () => {
  const day = core.daySummary(geometry, 0, 6);
  assert.equal(day.intervals.length, 2);
  assert.ok(day.intervals[0].end < day.intervals[1].start);
  const actual = day.intervals.reduce((sum, interval) => sum + interval.end - interval.start, 0);
  assert.equal(actual, day.facadeMinutes);
  assert.ok(day.facadeMinutes < day.intervals[1].end - day.intervals[0].start);
  assert.equal(core.daySummary(geometry, 0, 12).facadeMinutes, 0);
});

test('annual profiles contain representative days, not monthly accumulated hours', () => {
  const annual = core.profileAnnual(geometry, 180);
  assert.equal(annual.length, 12);
  annual.forEach((row, i) => {
    assert.equal(row.month, i + 1);
    assert.equal(row.samples, undefined);
    assert.ok(row.facadeMinutes >= 0 && row.facadeMinutes <= 1440);
    assert.ok(row.floorMinutes <= row.facadeMinutes);
  });
});

test('calculation preserves caller input and A/B reversal is symmetric', () => {
  const input = state({ bearingA: 135, bearingB: 270 });
  const before = JSON.stringify(input);
  const result = core.calculate(input);
  assert.equal(JSON.stringify(input), before);
  const reversed = core.calculate(state({ bearingA: 270, bearingB: 135 }));
  assert.deepEqual(result.a, reversed.b);
  assert.deepEqual(result.b, reversed.a);
  assert.deepEqual(result.annualA, reversed.annualB);
  assert.equal(result.valid, true);
  const equal = core.calculate(state({ bearingA: 270, bearingB: 270 }));
  assert.deepEqual(equal.a, equal.b);
});

test('all Spanish cities × 12 months × 8 bearings × 96 slots satisfy geometry and time invariants', () => {
  let projections = 0;
  for (const city of core.CITIES) for (let month = 1; month <= 12; month++) {
    const input = state({ city: city.id, month });
    const days = [];
    for (let bearing = 0; bearing < 360; bearing += 45) {
      const day = core.daySummary(input, bearing);
      days.push(day);
      assert.equal(day.samples.length, 96);
      assert.equal(day.facadeMinutes % 15, 0);
      assert.equal(day.floorMinutes % 15, 0);
      assert.ok(day.floorMinutes <= day.facadeMinutes);
      for (const intervals of [day.intervals, day.floorIntervals]) {
        intervals.forEach((interval, index) => {
          assert.ok(interval.start >= 0 && interval.end <= 1440 && interval.start < interval.end);
          if (index) assert.ok(intervals[index - 1].end < interval.start);
        });
      }
      for (const sample of day.samples) {
        const p = core.projectWindow(sample, bearing, input);
        projections++;
        assert.ok(p.area >= 0 && p.area <= input.roomWidth * input.roomDepth + 1e-8);
        assert.ok(p.depth >= 0 && p.depth <= input.roomDepth + 1e-8);
        assert.equal(p.lit, p.status === 'floor');
        assert.equal(p.lit, sample.lit);
        if (sample.altitude <= 0) assert.equal(p.status, 'night');
        for (const [x, y] of p.polygon) {
          assert.ok(Number.isFinite(x) && Number.isFinite(y));
          assert.ok(x >= -input.roomWidth / 2 - 1e-8 && x <= input.roomWidth / 2 + 1e-8);
          assert.ok(y >= -1e-8 && y <= input.roomDepth + 1e-8);
        }
      }
    }
    for (let direction = 0; direction < 4; direction++) {
      for (let slot = 0; slot < 96; slot++) {
        const a = days[direction].samples[slot];
        const b = days[direction + 4].samples[slot];
        assert.ok(!(a.facing && b.facing));
        if (a.altitude > 0) {
          const tangent = Math.abs(Math.cos((a.azimuth - direction * 45) * Math.PI / 180)) <= 1e-9;
          assert.equal(Number(a.facing) + Number(b.facing), tangent ? 0 : 1);
        }
      }
    }
  }
  assert.equal(projections, core.CITIES.length * 12 * 8 * 96);
});

test('varied valid rooms, low windows and blocked horizons preserve clipping bounds', () => {
  let seed = 20260908;
  function random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }
  for (let i = 0; i < 2500; i++) {
    const roomWidth = 2 + random() * 6;
    const sill = random() * 1.5;
    const input = state({ roomWidth, roomDepth: 2 + random() * 6, windowWidth: 0.5 + random() * (Math.min(4, roomWidth - 0.2) - 0.5), sill, windowHeight: 0.4 + random() * (Math.min(2.5, 3 - sill) - 0.4), obstruction: random() * 60 });
    assert.equal(core.validateState(input).valid, true);
    const sun = { altitude: random() * 180 - 90, azimuth: random() * 360 };
    const p = core.projectWindow(sun, random() * 359, input, input.obstruction);
    assert.ok(Number.isFinite(p.area) && p.area >= 0 && p.area <= input.roomWidth * input.roomDepth + 1e-8);
    assert.ok(Number.isFinite(p.depth) && p.depth >= 0 && p.depth <= input.roomDepth + 1e-8);
    for (const [x, y] of p.polygon) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      assert.ok(x >= -input.roomWidth / 2 - 1e-8 && x <= input.roomWidth / 2 + 1e-8);
      assert.ok(y >= -1e-8 && y <= input.roomDepth + 1e-8);
    }
  }
});
