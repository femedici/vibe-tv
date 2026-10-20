'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modulePath = path.join(__dirname, '../tizen/platform.js');

function load(timers) {
  assert.ok(fs.existsSync(modulePath), 'VibePlatform implementation must exist');
  if (!timers) return require(modulePath);
  const context = { module: { exports: {} }, Promise, setTimeout: timers.set, clearTimeout: timers.clear };
  vm.runInNewContext(fs.readFileSync(modulePath, 'utf8'), context);
  return context.module.exports;
}

function clock() {
  const pending = new Map();
  let id = 0;
  return {
    set(fn, ms) { assert.ok(ms > 0 && ms <= 10000); pending.set(++id, fn); return id; },
    clear(key) { pending.delete(key); },
    expire() { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(fn => fn()); },
    size() { return pending.size; }
  };
}

function api() {
  return {
    application: {
      getAppsInfo(success) { success([]); },
      launch(id, success) { success(); },
      getCurrentApplication() { return { exit() {} }; }
    },
    systeminfo: { getPropertyValue(name, success) { success({ connected: [], disconnected: [] }); } },
    tvwindow: { setSource(source, success) { success(source, 'MAIN'); } }
  };
}

test('CommonJS and browser globals expose the same platform contract', () => {
  const exported = load();
  assert.equal(typeof exported.create, 'function');
  const context = { Promise, setTimeout, clearTimeout };
  vm.runInNewContext(fs.readFileSync(modulePath, 'utf8'), context);
  assert.equal(typeof context.VibePlatform.create, 'function');
  assert.equal(context.VibePlatform.create().native, false);
});

test('preview rejects every hardware action without fabricated inventory or success', async () => {
  const platform = load().create();
  assert.equal(platform.native, false);
  for (const action of [() => platform.listApps(), () => platform.launchApp('real.app'),
    () => platform.launchInput(2), () => platform.exit()]) {
    await assert.rejects(action(), error => error.code === 'PREVIEW' && /prévia/i.test(error.message));
  }
});

test('partial API does not claim native capability', () => {
  assert.equal(load().create({ application: {} }).native, false);
});

test('inventory contains only sanitized real ids, names and local icon paths', async () => {
  const native = api();
  const rows = [
    { id: ' abc.App-1 ', name: ' YouTube\n TV ', iconPath: '/opt/apps/icon.png', privateToken: 'not-exported' },
    { id: 'abc.App-1', name: 'Duplicate', iconPath: '' },
    { id: 'unsafe app', name: 'Invalid' },
    { id: '', name: 'Empty' },
    { id: 'missing.name', name: null },
    { id: 'local.file', name: 'B'.repeat(180), iconPath: 'file:///opt/apps/other.png' },
    { id: 'remote.icon', name: 'Remote', iconPath: 'https://example.org/tracker.png' },
    { id: 'script.icon', name: 'Script', iconPath: 'javascript:alert(1)' },
    { id: 'network.icon', name: 'Network', iconPath: '//example.org/icon.png' },
    { id: 'slash.icon', name: 'Backslash', iconPath: '/\\example.org/icon.png' },
    null
  ];
  native.application.getAppsInfo = success => success(rows);
  const platform = load().create(native);
  assert.equal(platform.native, true);
  assert.deepEqual(await platform.listApps(), [
    { id: 'abc.App-1', name: 'YouTube  TV', iconPath: '/opt/apps/icon.png' },
    { id: 'local.file', name: 'B'.repeat(120), iconPath: 'file:///opt/apps/other.png' },
    { id: 'remote.icon', name: 'Remote', iconPath: '' },
    { id: 'script.icon', name: 'Script', iconPath: '' },
    { id: 'network.icon', name: 'Network', iconPath: '' },
    { id: 'slash.icon', name: 'Backslash', iconPath: '' }
  ]);
  assert.equal(rows[0].id, ' abc.App-1 ');
});

test('malformed inventory rejects instead of silently claiming no installed apps', async () => {
  const native = api();
  native.application.getAppsInfo = success => success({ apps: [] });
  await assert.rejects(load().create(native).listApps(), error => error.stage === 'LIST_APPS');
});

test('launch uses the exact validated id and resolves only the native success callback', async () => {
  const native = api();
  let finish, called;
  native.application.launch = (id, success) => { called = id; finish = success; };
  let resolved = false;
  const result = load().create(native).launchApp(' chosen.App-1 ').then(() => { resolved = true; });
  await Promise.resolve();
  assert.equal(called, 'chosen.App-1');
  assert.equal(resolved, false);
  finish();
  await result;
  assert.equal(resolved, true);
});

test('invalid app ids never reach the device', async () => {
  const native = api();
  let count = 0;
  native.application.launch = () => { count++; };
  const platform = load().create(native);
  for (const id of [null, '', '  ', 3, 'x/y', 'app\n.id', 'a'.repeat(257)]) {
    await assert.rejects(platform.launchApp(id), error => error.code === 'INVALID_TARGET');
  }
  assert.equal(count, 0);
});

test('callback errors and synchronous security exceptions retain stage context', async () => {
  const native = api();
  native.application.getAppsInfo = (success, failure) => failure({ name: 'SecurityError' });
  native.application.launch = () => { throw { name: 'NotFoundError' }; };
  const platform = load().create(native);
  await assert.rejects(platform.listApps(), error => error.stage === 'LIST_APPS' && /SecurityError/.test(error.message));
  await assert.rejects(platform.launchApp('real.app'), error => error.stage === 'LAUNCH_APP' && /NotFoundError/.test(error.message));
});

test('silent native APIs time out and ignore late callbacks', async () => {
  const timers = clock();
  const native = api();
  let lateSuccess;
  native.application.launch = (id, success) => { lateSuccess = success; };
  const result = load(timers).create(native).launchApp('real.app');
  assert.equal(timers.size(), 1);
  const rejected = assert.rejects(result, error => error.code === 'TIMEOUT' && error.stage === 'LAUNCH_APP');
  timers.expire();
  await rejected;
  lateSuccess();
  assert.equal(timers.size(), 0);
});

test('HDMI2 uses the enumerated object and opens native viewer only after source success', async () => {
  const native = api();
  const target = { type: 'HDMI', number: 2, signal: null };
  const calls = [];
  let selectDone;
  native.systeminfo.getPropertyValue = (name, success) => {
    calls.push(name);
    success({ connected: [{ type: 'HDMI', number: 1, signal: true }, target], disconnected: [] });
  };
  native.tvwindow.setSource = (source, success, failure, type) => {
    assert.equal(source, target);
    assert.equal(type, 'MAIN');
    calls.push('source');
    selectDone = success;
  };
  native.application.launch = (id, success) => { calls.push(id); success(); };
  const result = load().create(native).launchInput(2);
  await Promise.resolve();
  assert.deepEqual(calls, ['VIDEOSOURCE', 'source']);
  selectDone(target, 'MAIN');
  await result;
  assert.deepEqual(calls, ['VIDEOSOURCE', 'source', 'org.tizen.tv-viewer']);
});

test('missing HDMI2 and non-HDMI2 requests never select another source', async () => {
  const native = api();
  let mutations = 0;
  native.tvwindow.setSource = () => { mutations++; };
  native.systeminfo.getPropertyValue = (name, success) => success({ connected: [{ type: 'HDMI', number: 1 }], disconnected: [] });
  const platform = load().create(native);
  for (const value of [1, 3, '2', null]) {
    await assert.rejects(platform.launchInput(value), error => error.code === 'INVALID_TARGET');
  }
  await assert.rejects(platform.launchInput(2), error => error.code === 'INPUT_UNAVAILABLE');
  assert.equal(mutations, 0);
});

for (const list of ['connected', 'disconnected']) {
  test('enumerated HDMI2 in ' + list + ' can be selected without a video signal', async () => {
    const native = api();
    const target = { type: 'HDMI', number: 2, signal: list === 'connected' ? false : null };
    const sources = { connected: [{ type: 'TV', number: 1 }], disconnected: [] };
    sources[list].push(target);
    const calls = [];
    native.systeminfo.getPropertyValue = (name, success) => success(sources);
    native.tvwindow.setSource = (source, success, failure, type) => {
      assert.equal(source, target);
      assert.equal(type, 'MAIN');
      calls.push('source');
      success(source, type);
    };
    native.application.launch = (id, success) => { calls.push(id); success(); };
    await load().create(native).launchInput(2);
    assert.deepEqual(calls, ['source', 'org.tizen.tv-viewer']);
  });
}

test('ambiguous HDMI2 and malformed source lists are rejected without selection', async () => {
  const native = api();
  const platform = load().create(native);
  native.systeminfo.getPropertyValue = (name, success) => success({ connected: [{ type: 'HDMI', number: 2 }, { type: 'HDMI', number: 2 }] });
  await assert.rejects(platform.launchInput(2), error => error.code === 'INPUT_UNAVAILABLE');
  native.systeminfo.getPropertyValue = (name, success) => success({
    connected: [{ type: 'HDMI', number: 2 }], disconnected: [{ type: 'HDMI', number: 2 }]
  });
  await assert.rejects(platform.launchInput(2), error => error.code === 'INPUT_UNAVAILABLE');
  native.systeminfo.getPropertyValue = (name, success) => success({ connected: [], disconnected: {} });
  await assert.rejects(platform.launchInput(2), error => error.code === 'INVALID_RESPONSE');
  native.systeminfo.getPropertyValue = (name, success) => success(null);
  await assert.rejects(platform.launchInput(2), error => error.stage === 'LIST_INPUTS');
});

test('source failure never opens the viewer or falls back to another input', async () => {
  const native = api();
  let launches = 0;
  native.systeminfo.getPropertyValue = (name, success) => success({ connected: [{ type: 'HDMI', number: 2 }] });
  native.tvwindow.setSource = (source, success, failure) => failure({ name: 'NotSupportedError' });
  native.application.launch = () => { launches++; };
  await assert.rejects(load().create(native).launchInput(2), error => error.stage === 'SET_SOURCE');
  assert.equal(launches, 0);
});

test('viewer failure explicitly reports that HDMI source has already changed', async () => {
  const native = api();
  native.systeminfo.getPropertyValue = (name, success) => success({ connected: [{ type: 'HDMI', number: 2 }] });
  native.application.launch = (id, success, failure) => failure({ name: 'NotFoundError' });
  await assert.rejects(load().create(native).launchInput(2), error =>
    error.code === 'SOURCE_CHANGED' && error.stage === 'LAUNCH_VIEWER' && /alterada/.test(error.message));
});

test('timed-out source selection cannot later launch the viewer', async () => {
  const timers = clock();
  const native = api();
  let lateSuccess, launches = 0;
  native.systeminfo.getPropertyValue = (name, success) => success({ connected: [{ type: 'HDMI', number: 2 }] });
  native.tvwindow.setSource = (source, success) => { lateSuccess = success; };
  native.application.launch = () => { launches++; };
  const result = load(timers).create(native).launchInput(2);
  await Promise.resolve();
  const rejected = assert.rejects(result, error => error.stage === 'SET_SOURCE' && /confirmar/.test(error.message));
  timers.expire();
  await rejected;
  lateSuccess();
  await Promise.resolve();
  assert.equal(launches, 0);
});

test('exit invokes only the current application and propagates errors', async () => {
  const native = api();
  let exits = 0;
  native.application.getCurrentApplication = () => ({ exit() { exits++; } });
  await load().create(native).exit();
  assert.equal(exits, 1);
  native.application.getCurrentApplication = () => { throw { name: 'UnknownError' }; };
  await assert.rejects(load().create(native).exit(), error => error.stage === 'EXIT');
});
