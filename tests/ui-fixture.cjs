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
  window.tizen = {
    application: {
      getAppsInfo: function (success) { success([
        {id:'test.youtube',name:'YouTube'},
        {id:'test.netflix',name:'Netflix'},
        {id:'test.plex',name:'Plex (teste)'},
        {id:'test.ps5.app',name:'PlayStation 5'}
      ]); },
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
      success({connected:[{type:'HDMI',number:2}],disconnected:[]});
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
  });
}());
`);
const server = createPreviewServer(root);
server.listen(4175, '127.0.0.1', () => console.log('SIMULATED integration fixture: http://127.0.0.1:4175 (no TV)'));
const clean = () => { server.closeAllConnections(); server.close(); fs.rmSync(root,{recursive:true,force:true}); };
process.on('SIGINT', () => { clean(); process.exit(0); });
process.on('SIGTERM', () => { clean(); process.exit(0); });
server.on('error', error => { clean(); console.error(error.message); process.exitCode = 1; });
