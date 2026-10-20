// Optional browser integration fixture. Never packaged or connected to hardware.
// node tests/ui-fixture.cjs -> http://127.0.0.1:4175
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createPreviewServer} = require('../tools/preview.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-ui-fixture-'));
fs.cpSync(path.join(__dirname, '../tizen'), root, {recursive:true});
const index = path.join(root, 'index.html');
fs.writeFileSync(index, fs.readFileSync(index, 'utf8').replace('<script src="state.js"', '<script src="test-native.js" defer></script>\n  <script src="state.js"'));
fs.writeFileSync(path.join(root, 'test-native.js'), `
(function () {
  var launched = [];
  var inventoryCalls = 0;
  var retryScenario = location.search === '?inventory=retry';
  window.tizen = {
    application: {
      getAppsInfo: function (success, failure) {
        var call = ++inventoryCalls;
        document.body.setAttribute('data-test-inventory-calls', String(call));
        if (retryScenario && call === 1) return setTimeout(function () { failure({name:'UnknownError'}); }, 200);
        var apps = [
        {id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube',iconPath:'/assets/brands/youtube.png'},
        {id:'com.samsung.tv.cobalt-yt',name:'Youtube'},
        {id:'test.netflix',name:'Netflix',iconPath:'/missing-test-icon.png'},
        {id:'test.plex',name:'Plex (teste)',iconPath:'/assets/icon.png'},
        {id:'test.ps5.app',name:'PlayStation 5',iconPath:'/missing-test-icon.png'}
        ];
        if (retryScenario) setTimeout(function () { success(apps); }, 600);
        else success(apps);
      },
      launch: function (id, success, failure) {
        launched.push(id);
        document.body.setAttribute('data-test-calls', launched.join(','));
        if (id === 'test.netflix') failure({name:'NotFoundError'});
        else success();
      },
      getCurrentApplication: function () { return {exit:function () {
        document.body.setAttribute('data-test-exited','true');
      }}; }
    },
    systeminfo: {getPropertyValue:function(name,success) {
      success({connected:[{type:'TV',number:1,signal:null}],disconnected:[{type:'HDMI',number:2,signal:null}]});
    }},
    tvwindow: {setSource:function(source,success) {
      document.body.setAttribute('data-test-source', source.type + source.number);
      success(source,'MAIN');
    }}
  };
  document.addEventListener('DOMContentLoaded',function () {
    var badge = document.getElementById('preview-badge');
    badge.textContent = 'TESTE SIMULADO · SEM TV';
    badge.hidden = false;
    document.title = 'TESTE SIMULADO — Vibe TV';
    var mutations = 0;
    new MutationObserver(function (rows) {
      mutations += rows.length;
      document.body.setAttribute('data-test-shelf-mutations', String(mutations));
    }).observe(document.getElementById('favorites'), {childList:true});
  });
}());
`);
fs.writeFileSync(path.join(root, 'sizes.html'), '<!doctype html><meta charset="utf-8"><title>Vibe TV — teste de tamanhos</title><style>body{margin:0;background:#ddd;font:14px sans-serif}iframe{border:0;display:block;margin:20px}h1{margin:20px}</style><h1>TESTE SIMULADO: 1280×720 e 390×844</h1><iframe title="TV HD" src="index.html" width="1280" height="720"></iframe><iframe title="Tela estreita" src="index.html" width="390" height="844"></iframe>');
const server = createPreviewServer(root);
server.listen(4175, '127.0.0.1', () => console.log('SIMULATED integration fixture: http://127.0.0.1:4175 (no TV)'));
const clean = () => { server.closeAllConnections(); server.close(); fs.rmSync(root,{recursive:true,force:true}); };
process.on('SIGINT', () => { clean(); process.exit(0); });
process.on('SIGTERM', () => { clean(); process.exit(0); });
server.on('error', error => { clean(); console.error(error.message); process.exitCode = 1; });
