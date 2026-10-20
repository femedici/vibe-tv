const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const State = require(path.join(root, 'tizen/state.js'));
const Navigation = require(path.join(root, 'tizen/navigation.js'));
const Platform = require(path.join(root, 'tizen/platform.js'));
const source = fs.readFileSync(path.join(root, 'tizen/app.js'), 'utf8');

function controller(blockedStorage = false, startup = false) {
  let resolveLaunch, rejectLaunch, launchedId, resolveInventory, rejectInventory, inventoryCalls = 0, launchCalls = 0;
  const measurements = [];
  const scrolls = [];
  const nodes = {};
  const listeners = {};
  const windowListeners = {};
  const document = {
    body: {classList:{add(){},remove(){}}}, activeElement: null, addEventListener(name, fn) { listeners[name] = fn; },
    getElementById(id) { return nodes[id] || null; }
  };
  for (const id of ['toast', 'storage-note', 'hero-open', 'nav-settings', 'preview-badge', 'clock', 'panel-close', 'panel-overlay', 'add-button', ...State.catalog.map(item => 'favorite-' + item.id)]) {
    nodes[id] = {
      id, hidden: true, textContent: '', attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; },
      focus() { document.activeElement = this; }, scrollIntoView() { scrolls.push(id); },
      getBoundingClientRect() {
        measurements.push(id);
        return this.rect || {left:0,top:0,right:350,bottom:300,width:350,height:300};
      }
    };
  }
  State.catalog.forEach((item, index) => {
    const left = index * 130;
    nodes['favorite-' + item.id].rect = {left,top:330,right:left+130,bottom:420,width:130,height:90};
  });
  nodes.favorites = {
    scrollLeft:0,
    getBoundingClientRect() {
      measurements.push('favorites');
      return {left:0,top:320,right:1100,bottom:430,width:1100,height:110};
    },
    contains(node) { return node.id.startsWith('favorite-'); }
  };
  nodes.hub = {setAttribute(){}, removeAttribute(){}, querySelectorAll() { return ['hero-open', ...State.catalog.map(item => 'favorite-' + item.id)].map(id => nodes[id]); }};
  document.activeElement = nodes['favorite-youtube'];
  const window = {
    innerWidth:1920, innerHeight:1080,
    addEventListener(name, fn) { windowListeners[name] = fn; },
    setInterval() {},
    VibeState: State, VibeNavigation: Navigation, VibePlatform: Platform,
    localStorage: { getItem() { return null; }, setItem() { if (blockedStorage) throw new Error('blocked'); } },
    tizen: { application: {
      getAppsInfo(success, failure) { inventoryCalls++; resolveInventory = success; rejectInventory = failure; },
      launch(id, success, failure) { launchCalls++; launchedId = id; resolveLaunch = success; rejectLaunch = failure; }
    } },
    clearTimeout() {}, setTimeout() { return 1; }
  };
  const start = source.indexOf("  byId('preview-badge').hidden");
  assert.ok(start > 0, 'controller startup marker must exist');
  // Keep real launch/commit/focus and state/platform logic; skip visual startup and rendering.
  vm.runInNewContext(source.slice(0, start) + `
    render = function () {};
    renderPanel = function () {};
    inventory = ${startup ? '[]' : "[{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]"};
    window.review = {launch:launch, action:handleAction, refresh:refreshInventory,
      inventory:function (apps) { inventory = apps; },
      setState:function (next) { state = next; },
      state:function () { return state; }};
  ` + (startup ? source.slice(start) : '}());'), { window, document, Date, Promise });
  return {
    nodes, document, measurements, scrolls,
    key(key) { listeners.keydown({key,preventDefault(){}}); },
    state: window.review.state,
    setState(next) {
      window.review.setState(next);
      next.order.forEach((id, index) => {
        const rect = nodes['favorite-' + id].rect;
        rect.left = index * 130; rect.right = rect.left + 130;
      });
    },
    inventory: window.review.inventory,
    refresh() { window.review.refresh(); },
    inventoryCalls() { return inventoryCalls; },
    launchCalls() { return launchCalls; },
    addPanel() { window.review.action({id:'add-button',dataset:{action:'panel',panel:'add'}}); },
    visibility(hidden) { document.hidden = hidden; listeners.visibilitychange(); },
    windowFocus(target = window) { if (windowListeners.focus) windowListeners.focus({target}); },
    windowBlur() { if (windowListeners.blur) windowListeners.blur({target:window}); },
    async finishInventory(apps, failed = false) {
      if (failed) rejectInventory({name:'UnknownError'}); else resolveInventory(apps);
      await new Promise(setImmediate);
    },
    samsungHome() { window.review.action({dataset:{action:"samsung-home"}}); },
    launchedId() { return launchedId; },
    launch() { window.review.launch(State.catalog[0]); },
    async finish(failed = false) {
      if (failed) rejectLaunch({ name: 'NotFoundError' }); else resolveLaunch();
      await new Promise(setImmediate);
    }
  };
}

test('successful launch keeps the storage failure warning visible', async () => {
  const app = controller(true);
  app.launch();
  await app.finish();
  assert.equal(app.state().last.id, 'youtube');
  assert.equal(app.nodes['storage-note'].hidden, false);
  assert.equal(app.nodes.toast.hidden, false);
  assert.match(app.nodes.toast.textContent, /não permitiu salvar/);
});

for (const failed of [false, true]) {
  test(`launch ${failed ? 'failure' : 'success'} keeps focus moved while pending`, async () => {
    const app = controller();
    app.launch();
    app.nodes['nav-settings'].focus();
    await app.finish(failed);
    assert.equal(app.document.activeElement.id, 'nav-settings');
    assert.equal(app.state().last && app.state().last.id, failed ? null : 'youtube');
  });
}

for (const failed of [false, true]) {
  test(`Samsung menu ${failed ? 'failure is visible' : 'opens the observed system app'} without changing history`, async () => {
    const app = controller();
    app.samsungHome();
    assert.equal(app.launchedId(), 'com.samsung.tv.csfs');
    await app.finish(failed);
    assert.equal(app.state().last, null);
    if (failed) assert.equal(app.nodes.toast.hidden, false);
  });
}

test('Down from hero reaches the first favorite even after the dock is scrolled', () => {
  const app = controller();
  app.nodes['favorite-youtube'].rect.left = -700;
  app.nodes['favorite-youtube'].rect.right = -570;
  app.nodes['hero-open'].focus();
  app.key('ArrowDown');
  assert.equal(app.document.activeElement.id, 'favorite-youtube');
});

test('favorite arrows follow saved order without measuring unrelated hub buttons or scrolling visible items', () => {
  const app = controller();
  app.setState(State.move(app.state(), 'netflix', -1));
  app.key('ArrowRight');
  assert.equal(app.document.activeElement.id, 'favorite-netflix');
  app.key('ArrowLeft');
  assert.equal(app.document.activeElement.id, 'favorite-youtube');
  assert.ok(app.measurements.every(id => ['favorites','favorite-youtube','favorite-netflix'].includes(id)));
  assert.deepEqual(app.scrolls, []);
  app.measurements.length = 0;
  for (let i = 0; i < 100; i++) app.key('ArrowLeft');
  assert.equal(app.document.activeElement.id, 'favorite-youtube');
  assert.deepEqual(app.measurements, [], 'a held arrow at the row boundary performs no layout reads');
});

test('favorite overflow scrolls only the dock, and Up returns to the hero', () => {
  const app = controller();
  app.nodes['favorite-ps5'].rect = {left:1120,right:1250,top:330,bottom:420,width:130,height:90};
  app.key('ArrowRight');
  assert.equal(app.document.activeElement.id, 'favorite-ps5');
  assert.equal(app.nodes.favorites.scrollLeft, 150);
  assert.deepEqual(app.scrolls, []);
  app.key('ArrowUp');
  assert.equal(app.document.activeElement.id, 'hero-open');
});

test('a favorite below the narrow viewport remains reachable by page scrolling', () => {
  const app = controller();
  app.nodes['favorite-ps5'].rect = {left:130,right:260,top:1100,bottom:1190,width:130,height:90};
  app.key('ArrowRight');
  assert.equal(app.document.activeElement.id, 'favorite-ps5');
  assert.deepEqual(app.scrolls, ['favorite-ps5']);
});

test('known native apps open immediately while inventory refresh is pending', async () => {
  const app = controller();
  app.refresh();
  app.launch();
  assert.equal(app.launchedId(), '9Ur5IzDKqV.TizenYouTube');
  await app.finish();
  await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
});

test('failed inventory refresh preserves a previously identified app', async () => {
  const app = controller();
  app.refresh();
  await app.finishInventory(null, true);
  app.launch();
  assert.equal(app.launchedId(), '9Ur5IzDKqV.TizenYouTube');
  await app.finish();
});

test('an unresolved favorite waits for inventory and never guesses an absent target', async () => {
  const app = controller();
  app.inventory([]);
  app.refresh();
  app.launch();
  assert.equal(app.launchedId(), undefined);
  await app.finishInventory([]);
  assert.equal(app.launchedId(), undefined);
  assert.match(app.nodes.toast.textContent, /não foi identificado/);
  assert.equal(app.state().last, null);
});

test('startup discovers installed apps without a manual refresh', async () => {
  const app = controller(false, true);
  assert.equal(app.inventoryCalls(), 1);
  await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
  app.launch();
  assert.equal(app.launchedId(), '9Ur5IzDKqV.TizenYouTube');
  await app.finish();
});

test('visible return and window focus share one in-flight inventory refresh', async () => {
  const app = controller();
  app.visibility(true);
  assert.equal(app.inventoryCalls(), 0);
  app.visibility(false);
  app.windowFocus();
  assert.equal(app.inventoryCalls(), 1);
  await app.finishInventory([]);
  app.launch();
  await app.finishInventory([]);
  assert.equal(app.launchedId(), undefined, 'a removed app is no longer launchable');
});

test('return through window focus refreshes again without hidden-page or per-button requests', async () => {
  const app = controller();
  app.inventory([]);
  app.document.hidden = true;
  app.windowFocus();
  assert.equal(app.inventoryCalls(), 0);
  app.document.hidden = false;
  app.windowFocus(app.nodes['favorite-youtube']);
  assert.equal(app.inventoryCalls(), 0);
  app.windowFocus();
  assert.equal(app.inventoryCalls(), 1);
  await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
  app.launch();
  assert.equal(app.launchedId(), '9Ur5IzDKqV.TizenYouTube');
  await app.finish();
  app.windowFocus();
  assert.equal(app.inventoryCalls(), 2);
  await app.finishInventory([]);
});

for (const path of ['visibility', 'window focus']) {
  test(`return through ${path} queues one fresh lookup if an older lookup is still pending`, async () => {
    const app = controller();
    app.inventory([]);
    app.refresh();
    if (path === 'visibility') {
      app.visibility(true);
      app.visibility(false);
    } else {
      app.windowBlur();
    }
    app.windowFocus();
    app.windowFocus();
    assert.equal(app.inventoryCalls(), 1, 'no concurrent native lookups');
    await app.finishInventory([]);
    assert.equal(app.inventoryCalls(), 2, 'return must not be lost behind the previous lookup');
    await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
    assert.equal(app.inventoryCalls(), 2, 'one follow-up, not a refresh loop');
    app.launch();
    assert.equal(app.launchedId(), '9Ur5IzDKqV.TizenYouTube');
    await app.finish();
  });
}

test('a queued return waits while hidden again and retries after a failed older lookup', async () => {
  const app = controller();
  app.refresh();
  app.visibility(true);
  app.visibility(false);
  app.visibility(true);
  await app.finishInventory(null, true);
  assert.equal(app.inventoryCalls(), 1, 'no hidden-page follow-up');
  app.visibility(false);
  app.windowFocus();
  assert.equal(app.inventoryCalls(), 2, 'the next return retries automatically');
  app.launch();
  assert.equal(app.launchedId(), '9Ur5IzDKqV.TizenYouTube', 'last identified target remains usable');
  await app.finish();
  await app.finishInventory([]);
  assert.equal(app.inventoryCalls(), 2, 'no refresh loop');
});

test('one activation waits for the initial lookup and launches once without stealing moved focus', async () => {
  const app = controller(false, true);
  app.launch();
  app.launch();
  app.nodes['nav-settings'].focus();
  assert.equal(app.inventoryCalls(), 1);
  assert.equal(app.launchCalls(), 0);
  await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
  assert.equal(app.launchCalls(), 1);
  assert.equal(app.launchedId(), '9Ur5IzDKqV.TizenYouTube');
  await app.finish();
  assert.equal(app.document.activeElement.id, 'nav-settings');
});

for (const outcome of ['found', 'missing', 'failed']) {
  test(`unresolved activation starts one automatic lookup: ${outcome}`, async () => {
    const app = controller();
    app.inventory([]);
    app.launch();
    app.launch();
    assert.equal(app.inventoryCalls(), 1);
    await app.finishInventory(outcome === 'found' ? [{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}] : [], outcome === 'failed');
    if (outcome === 'found') {
      assert.equal(app.launchCalls(), 1);
      await app.finish();
      assert.equal(app.state().last.id, 'youtube');
    } else {
      assert.equal(app.launchCalls(), 0);
      assert.equal(app.state().last, null);
      assert.match(app.nodes.toast.textContent, outcome === 'failed' ? /Não foi possível consultar/ : /não foi identificado/);
      app.launch();
      assert.equal(app.inventoryCalls(), 2, 'a failed attempt releases pending for a new activation');
      await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
      assert.equal(app.launchCalls(), 1);
      await app.finish();
    }
  });
}

test('Add retries after a failed startup and shares any pending lookup', async () => {
  const app = controller(false, true);
  await app.finishInventory(null, true);
  app.addPanel();
  app.addPanel();
  assert.equal(app.inventoryCalls(), 2);
  await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
  app.launch();
  assert.equal(app.launchedId(), '9Ur5IzDKqV.TizenYouTube');
  await app.finish();
});

test('activation waits through a queued return instead of using an older missing snapshot', async () => {
  const app = controller(false, true);
  app.visibility(true);
  app.visibility(false);
  app.launch();
  await app.finishInventory([]);
  assert.equal(app.inventoryCalls(), 2);
  assert.equal(app.launchCalls(), 0);
  await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
  assert.equal(app.launchCalls(), 1);
  await app.finish();
});

test('removing the selected favorite during lookup never launches another item', async () => {
  const app = controller(false, true);
  app.launch();
  app.setState(State.remove(app.state(), 'youtube'));
  await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
  assert.equal(app.launchCalls(), 0);
  assert.equal(app.state().last, null);
  assert.match(app.nodes.toast.textContent, /não foi identificado/);
});

test('leaving the hub cancels a waiting activation even if the owner returns before lookup finishes', async () => {
  const app = controller(false, true);
  app.launch();
  app.visibility(true);
  app.visibility(false);
  await app.finishInventory([]);
  await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
  assert.equal(app.launchCalls(), 0);
  assert.equal(app.state().last, null);
  assert.match(app.nodes.toast.textContent, /cancelada/);
  app.launch();
  assert.equal(app.launchCalls(), 1, 'a new explicit activation is still allowed');
  await app.finish();
});

for (const failed of [false, true]) {
  test(`hero launch clears a favorite busy marker rebuilt during lookup (${failed ? 'failure' : 'success'})`, async () => {
    const app = controller(false, true);
    app.nodes['hero-open'].focus();
    app.launch();
    app.nodes['favorite-youtube'].setAttribute('aria-busy', 'true');
    await app.finishInventory([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}]);
    await app.finish(failed);
    assert.equal(app.nodes['hero-open'].attributes['aria-busy'], undefined);
    assert.equal(app.nodes['favorite-youtube'].attributes['aria-busy'], undefined);
  });
}
