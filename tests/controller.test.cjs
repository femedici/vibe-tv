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
  let resolveLaunch, rejectLaunch;
  const nodes = {};
  const document = {
    body: {}, activeElement: null, addEventListener() {},
    getElementById(id) { return nodes[id] || null; }
  };
  for (const id of ['toast', 'storage-note', 'favorite-youtube', 'nav-settings']) {
    nodes[id] = {
      id, hidden: true, textContent: '', setAttribute() {}, removeAttribute() {},
      focus() { document.activeElement = this; }, scrollIntoView() {}
    };
  }
  document.activeElement = nodes['favorite-youtube'];
  const window = {
    VibeState: State, VibeNavigation: Navigation, VibePlatform: Platform,
    localStorage: { getItem() { return null; }, setItem() { if (blockedStorage) throw new Error('blocked'); } },
    tizen: { application: {
      getAppsInfo() {},
      launch(id, success, failure) { resolveLaunch = success; rejectLaunch = failure; }
    } },
    clearTimeout() {}, setTimeout() { return 1; }
  };
  const start = source.indexOf("  byId('preview-badge').hidden");
  assert.ok(start > 0, 'controller startup marker must exist');
  // Keep real launch/commit/focus and state/platform logic; skip visual startup and rendering.
  vm.runInNewContext(source.slice(0, start) + `
    render = function () {};
    inventory = [{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube'}];
    window.review = {launch:launch, state:function () { return state; }};
  }());`, { window, document, Date, Promise });
  return {
    nodes, document,
    state: window.review.state,
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
