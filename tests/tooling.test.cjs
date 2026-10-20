const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createPreviewServer } = require('../tools/preview.cjs');
const { packageApplication } = require('../tools/package-tizen.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-tooling-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('preview serves only its root, reports missing assets and cannot expose a symlink', async t => {
  const temp = fixture(t);
  const root = path.join(temp, 'app');
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'index.html'), '<h1>Vibe TV</h1>');
  fs.writeFileSync(path.join(temp, 'secret.txt'), 'private');
  fs.symlinkSync(path.join(temp, 'secret.txt'), path.join(root, 'leak.txt'));
  const server = createPreviewServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = 'http://127.0.0.1:' + server.address().port;
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Vibe TV/);
  assert.equal((await fetch(base + '/missing.js')).status, 404);
  assert.equal((await fetch(base + '/leak.txt')).status, 403);
  assert.equal((await fetch(base + '/%2e%2e%2fsecret.txt')).status, 403);
  assert.equal((await fetch(base + '/index.html', {method: 'POST'})).status, 405);
});

test('unsigned package includes only runtime assets and rejects missing source', t => {
  const temp = fixture(t), root = path.join(temp, 'app');
  fs.mkdirSync(root);
  assert.throws(() => packageApplication(root, path.join(temp,'missing.wgt')), /Missing/);
  for (const file of ['index.html','styles.css','app.js','navigation.js','state.js','platform.js']) fs.writeFileSync(path.join(root,file),'test');
  fs.writeFileSync(path.join(root,'config.xml'), '<widget xmlns="http://www.w3.org/ns/widgets" id="https://example.test/vibetv" version="1.0.0"><content src="index.html"/></widget>');
  fs.mkdirSync(path.join(root,'assets'));
  fs.writeFileSync(path.join(root,'assets','logo.svg'), '<svg/>');
  fs.writeFileSync(path.join(root,'credentials.p12'), 'never package');
  const output = path.join(temp,'VibeTV-unsigned.wgt');
  packageApplication(root, output);
  const entries = execFileSync('unzip',['-Z1',output],{encoding:'utf8'}).trim().split('\n');
  assert.ok(entries.includes('index.html'));
  assert.ok(entries.includes('assets/logo.svg'));
  assert.ok(!entries.some(name => /credentials|signature|\.git/.test(name)));
  fs.symlinkSync(path.join(temp,'outside'),path.join(root,'assets','outside'));
  assert.throws(() => packageApplication(root,output), /symbolic link/i);
});
