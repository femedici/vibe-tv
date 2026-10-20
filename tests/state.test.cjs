'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modulePath = path.join(__dirname, '../tizen/state.js');
const key = 'vibe-tv.preferences.v1';
const initialOrder = ['youtube', 'ps5', 'netflix', 'prime', 'max', 'samsung', 'disney', 'spotify'];

function stateModule() {
  assert.ok(fs.existsSync(modulePath), 'VibeState implementation must exist');
  return require(modulePath);
}

function memoryStorage(initial) {
  const data = new Map(initial === undefined ? [] : [[key, initial]]);
  return {
    getItem: name => data.has(name) ? data.get(name) : null,
    setItem: (name, value) => data.set(name, value)
  };
}

function custom(appId = 'Example.Video') {
  return {id: 'app:' + appId, name: 'Example Video', kind: 'app', appId, iconPath: '/opt/apps/icon.png'};
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.keys(value).forEach(key => freeze(value[key]));
    Object.freeze(value);
  }
  return value;
}

test('first run has the requested order, five skins and no invented history', () => {
  const state = stateModule();
  assert.deepEqual(state.catalog.map(item => item.id), initialOrder);
  assert.deepEqual(state.themes, ['dark', 'light', 'gray', 'pastel', 'wine']);
  assert.deepEqual(state.defaults(), {version: 1, theme: 'dark', order: initialOrder, custom: [], last: null});
  assert.equal(state.catalog[1].kind, 'input');
  assert.equal(state.catalog[1].input, 2);
  assert.ok(state.catalog.every(item => Array.isArray(item.aliases)));
  const first = state.defaults();
  first.order.pop();
  assert.deepEqual(state.defaults().order, initialOrder);
});

test('preferences and launch history survive save/load and all themes persist', () => {
  const state = stateModule();
  const storage = memoryStorage();
  let value = state.add(state.remove(state.defaults(), 'max'), custom());
  value = state.move(value, 'app:Example.Video', -20);
  value = state.recordLaunch(value, 'app:Example.Video', 1760000000000);
  state.themes.forEach(theme => {
    value = state.setTheme(value, theme);
    assert.equal(state.save(storage, value), true);
    assert.deepEqual(state.load(storage), value);
  });
  assert.equal(state.items(value)[0].appId, 'Example.Video');
  assert.equal(state.items(value).some(item => item.id === 'max'), false);
});

test('load returns safe defaults for absent, corrupt, unsupported or blocked storage', () => {
  const state = stateModule();
  [undefined, null, '', '{broken', 'null', '[]', '{}', '{"version":2}'].forEach(raw => {
    assert.deepEqual(state.load(memoryStorage(raw)), state.defaults());
  });
  assert.deepEqual(state.load(null), state.defaults());
  assert.deepEqual(state.load({getItem() { throw new Error('denied'); }}), state.defaults());
});

test('load sanitizes partial corruption while retaining valid favorites and theme', () => {
  const state = stateModule();
  const dirty = {
    version: 1, theme: 'wine', order: ['netflix', 'netflix', 'unknown', 'app:Example.Video', 'youtube'],
    custom: [custom(), custom(), {id: 'app:bad', name: 'bad', kind: 'app', appId: 'different'}],
    last: {id: 'unknown', at: 100}, secret: 'not part of preferences'
  };
  assert.deepEqual(state.load(memoryStorage(JSON.stringify(dirty))), {
    version: 1, theme: 'wine', order: ['netflix', 'app:Example.Video', 'youtube'], custom: [custom()], last: null
  });
  const badTheme = state.defaults();
  badTheme.theme = 'invalid';
  assert.equal(state.load(memoryStorage(JSON.stringify(badTheme))).theme, 'dark');
});

test('save failures and invalid state cannot replace previous valid preferences', () => {
  const state = stateModule();
  const storage = memoryStorage();
  const valid = state.setTheme(state.defaults(), 'gray');
  assert.equal(state.save(storage, valid), true);
  const before = storage.getItem(key);
  [null, {}, {version: 2}, Object.assign({}, valid, {theme: 'invalid'}), Object.assign({}, valid, {order: ['unknown']})].forEach(value => {
    assert.equal(state.save(storage, value), false);
    assert.equal(storage.getItem(key), before);
  });
  assert.equal(state.save(null, valid), false);
  assert.equal(state.save({setItem() { throw new Error('quota'); }}, valid), false);
});

test('save accepts valid values regardless of object property insertion order', () => {
  const state = stateModule();
  const storage = memoryStorage();
  const value = state.add(state.defaults(), custom());
  value.custom[0] = {name: 'Example Video', appId: 'Example.Video', id: 'app:Example.Video', kind: 'app', iconPath: '/opt/apps/icon.png'};
  value.last = {at: 123, id: 'youtube'};
  assert.equal(state.save(storage, value), true);
  assert.deepEqual(state.load(storage), value);
});

test('move respects shelf boundaries and rejects unknown items or invalid offsets', () => {
  const state = stateModule();
  const value = state.defaults();
  assert.deepEqual(state.move(value, 'youtube', -1), value);
  assert.deepEqual(state.move(value, 'spotify', 1), value);
  assert.equal(state.move(value, 'spotify', -100).order[0], 'spotify');
  assert.equal(state.move(value, 'youtube', 100).order[7], 'youtube');
  assert.deepEqual(state.move(value, 'ps5', -1).order.slice(0, 2), ['ps5', 'youtube']);
  [0.5, NaN, Infinity, '1', null].forEach(delta => assert.deepEqual(state.move(value, 'ps5', delta), value));
  assert.deepEqual(state.move(value, 'unknown', 1), value);
});

test('remove can empty favorites, clears matching history and re-adds default items', () => {
  const state = stateModule();
  let value = state.recordLaunch(state.defaults(), 'ps5', 123);
  value = state.remove(value, 'ps5');
  assert.equal(value.last, null);
  assert.equal(state.items(value).some(item => item.id === 'ps5'), false);
  value = state.add(value, state.catalog[1]);
  assert.equal(value.order[value.order.length - 1], 'ps5');
  assert.deepEqual(state.add(value, state.catalog[1]), value);
  initialOrder.forEach(id => { value = state.remove(value, id); });
  assert.deepEqual(state.items(value), []);
  const storage = memoryStorage();
  assert.equal(state.save(storage, value), true);
  assert.deepEqual(state.load(storage).order, []);
});

test('custom app identity is validated and duplicate app targets are rejected', () => {
  const state = stateModule();
  let value = state.add(state.defaults(), custom());
  assert.equal(value.custom.length, 1);
  assert.deepEqual(state.add(value, custom()), value);
  assert.deepEqual(state.add(value, Object.assign({}, custom(), {id: 'app:another'})), value);
  [null, {}, custom('bad target'), custom('a'.repeat(257)), Object.assign({}, custom('Other'), {name: ''}),
    Object.assign({}, custom('Other'), {name: 'a'.repeat(121)}), Object.assign({}, custom('Other'), {kind: 'input'}),
    Object.assign({}, custom('Other'), {name: 'Bad\nName'})].forEach(item => {
    assert.deepEqual(state.add(value, item), value);
  });
  value = state.recordLaunch(value, 'app:Example.Video', 10);
  value = state.remove(value, 'app:Example.Video');
  assert.deepEqual(value.custom, []);
  assert.equal(value.last, null);
});

test('custom icons are optional local paths and extra data is not persisted', () => {
  const state = stateModule();
  ['https://example.com/icon.png', '//example.com/icon.png', 'javascript:alert(1)', 'data:image/png;base64,a', '/'.repeat(2049)].forEach(iconPath => {
    const item = state.add(state.defaults(), Object.assign({}, custom(), {iconPath, token: 'unused'})).custom[0];
    assert.equal(Object.hasOwn(item, 'iconPath'), false);
    assert.equal(Object.hasOwn(item, 'token'), false);
  });
  const item = state.add(state.defaults(), Object.assign({}, custom(), {iconPath: 'file:///opt/icon.png'})).custom[0];
  assert.equal(item.iconPath, 'file:///opt/icon.png');
});

test('history changes only for an explicit favorite and valid timestamp', () => {
  const state = stateModule();
  const value = state.recordLaunch(state.defaults(), 'youtube', 100);
  assert.deepEqual(value.last, {id: 'youtube', at: 100});
  assert.deepEqual(state.recordLaunch(value, 'missing', 200), value);
  [undefined, null, '200', -1, NaN, Infinity, 1.5].forEach(time => {
    assert.deepEqual(state.recordLaunch(value, 'netflix', time), value);
  });
  assert.deepEqual(state.remove(value, 'spotify').last, value.last);
});

test('state transformations never mutate inputs or leak mutable catalog entries', () => {
  const state = stateModule();
  const value = freeze(state.add(state.defaults(), custom()));
  const before = JSON.stringify(value);
  [state.setTheme(value, 'light'), state.move(value, 'youtube', 1), state.add(value, freeze(custom('Other'))),
    state.remove(value, 'youtube'), state.recordLaunch(value, 'youtube', 30), state.setTheme(value, 'unknown')].forEach(next => {
    assert.notEqual(next, value);
  });
  assert.equal(JSON.stringify(value), before);
  const items = state.items(value);
  items[0].name = 'Changed';
  items[0].aliases.push('Changed');
  items[8].name = 'Changed';
  assert.equal(state.items(value)[0].name, 'YouTube');
  assert.equal(state.items(value)[8].name, 'Example Video');
  [null, undefined, [], {}, 'bad'].forEach(invalid => {
    assert.deepEqual(state.setTheme(invalid, 'bad'), state.defaults());
    assert.deepEqual(state.items(invalid).map(item => item.id), initialOrder);
  });
});

test('browser script exposes the same API without CommonJS or modern-only syntax', () => {
  const state = stateModule();
  const source = fs.readFileSync(modulePath, 'utf8');
  assert.doesNotMatch(source, /\?\.|\?\?/);
  const browser = {};
  vm.runInNewContext(source, browser);
  assert.deepEqual(Object.keys(browser.VibeState), Object.keys(state));
  assert.equal(JSON.stringify(browser.VibeState.defaults()), JSON.stringify(state.defaults()));
});
