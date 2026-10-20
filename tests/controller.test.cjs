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

function controller(blockedStorage = false) {
  let resolveLaunch, rejectLaunch, launchedId, resolveInventory, rejectInventory;
  const measurements = [];
  const scrolls = [];
  const nodes = {};
  const listeners = {};
  const document = {
    body: {}, activeElement: null, addEventListener(name, fn) { listeners[name] = fn; },
    getElementById(id) { return nodes[id] || null; }
  };
  for (const id of ['toast', 'storage-note', 'hero-open', 'nav-settings', ...State.catalog.map(item => 'favorite-' + item.id)]) {
    nodes[id] = {
      id, hidden: true, textContent: '', setAttribute() {}, removeAttribute() {},
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
  nodes.hub = {querySelectorAll() { return ['hero-open', ...State.catalog.map(item => 'favorite-' + item.id)].map(id => nodes[id]); }};
  document.activeElement = nodes['favorite-youtube'];
  const window = {
    innerWidth:1920, innerHeight:1080,
    VibeState: State, VibeNavigation: Navigation, VibePlatform: Platform,
    localStorage: { getItem() { return null; }, setItem() { if (blockedStorage) throw new Error('blocked'); } },
    tizen: { application: {
      getAppsInfo(success, failure) { resolveInventory = success; rejectInventory = failure; },
      launch(id, success, failure) { launchedId = id; resolveLaunch = success; rejectLaunch = failure; }
    } },
    clearTimeout() {}, setTimeout() { return 1; }
  };
  const start = source.indexOf("  byId('preview-badge').hidden");
  assert.ok(start > 0, 'controller startup marker must exist');
  // Keep real launch/commit/focus and state/platform logic; skip visual startup and rendering.
  vm.runInNewContext(source.slice(0, start) + `
    render = function () {};
    inventory = [{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}];
    window.review = {launch:launch, action:handleAction, refresh:refreshInventory,
      inventory:function (apps) { inventory = apps; },
      setState:function (next) { state = next; },
      state:function () { return state; }};
  }());`, { window, document, Date, Promise });
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
    refresh() { window.review.refresh(false); },
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

test('a fresh inventory removes an uninstalled target; initial pending lookup never guesses it', async () => {
  const app = controller();
  app.inventory([]);
  app.refresh();
  app.launch();
  assert.equal(app.launchedId(), undefined);
  assert.match(app.nodes.toast.textContent, /Aguarde a consulta/);
  await app.finishInventory([]);
  app.launch();
  assert.equal(app.launchedId(), undefined);
  assert.match(app.nodes.toast.textContent, /não foi identificado/);
});
