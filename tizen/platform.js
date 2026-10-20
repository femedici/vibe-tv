(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VibePlatform = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var TIMEOUT_MS = 5000;
  var stages = {
    LIST_APPS: 'Não foi possível consultar os aplicativos instalados.',
    LAUNCH_APP: 'Não foi possível abrir o aplicativo.',
    LIST_INPUTS: 'Não foi possível consultar as entradas da TV.',
    SET_SOURCE: 'Não foi possível confirmar a troca para HDMI 2.',
    LAUNCH_VIEWER: 'Não foi possível abrir a imagem da entrada HDMI 2.',
    EXIT: 'Não foi possível sair do Vibe TV.'
  };

  function failure(code, stage, message) {
    var error = new Error(message);
    error.code = code;
    error.stage = stage;
    return error;
  }

  function nativeFailure(stage, error) {
    var name = error && typeof error.name === 'string' && /^[A-Za-z]{1,60}$/.test(error.name) ? error.name : 'Erro da TV';
    return failure('NATIVE_ERROR', stage, stages[stage] + ' (' + name + ')');
  }

  function request(stage, invoke) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        reject(failure('TIMEOUT', stage, stages[stage] + ' A TV não confirmou a operação a tempo.'));
      }, TIMEOUT_MS);
      function finish(error, value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(nativeFailure(stage, error));
        else resolve(value);
      }
      try {
        invoke(function (value) { finish(null, value); }, function (error) { finish(error || { name: 'UnknownError' }); });
      } catch (error) {
        finish(error || { name: 'UnknownError' });
      }
    });
  }

  function appId(value) {
    if (typeof value !== 'string' || /[\x00-\x1f\x7f]/.test(value)) return '';
    var id = value.trim();
    return /^[A-Za-z0-9_.-]{1,256}$/.test(id) ? id : '';
  }

  function iconPath(value) {
    if (typeof value !== 'string' || value.length > 2048 || /[\\\x00-\x1f\x7f]/.test(value)) return '';
    return /^(?:\/[^/]|file:\/\/\/[^/])/.test(value) ? value : '';
  }

  function inventory(rows) {
    if (!Array.isArray(rows)) throw failure('INVALID_RESPONSE', 'LIST_APPS', stages.LIST_APPS);
    var seen = Object.create(null);
    var result = [];
    rows.forEach(function (row) {
      if (!row || typeof row !== 'object') return;
      var id = appId(row.id);
      var name = typeof row.name === 'string' ? row.name.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 120) : '';
      if (!id || !name || seen[id]) return;
      seen[id] = true;
      result.push({ id: id, name: name, iconPath: iconPath(row.iconPath) });
    });
    return result;
  }

  function create(tizenApi) {
    var application = tizenApi && tizenApi.application;
    var native = Boolean(application && typeof application.getAppsInfo === 'function' && typeof application.launch === 'function');

    function preview(stage) {
      return Promise.reject(failure('PREVIEW', stage, 'Modo de prévia: esta ação só está disponível no aplicativo instalado na TV.'));
    }

    function launch(id, stage) {
      return request(stage, function (success, error) { application.launch(id, success, error); });
    }

    function listApps() {
      if (!native) return preview('LIST_APPS');
      return request('LIST_APPS', function (success, error) { application.getAppsInfo(success, error); }).then(inventory);
    }

    function launchApp(value) {
      if (!native) return preview('LAUNCH_APP');
      var id = appId(value);
      if (!id) return Promise.reject(failure('INVALID_TARGET', 'LAUNCH_APP', 'O aplicativo não possui um identificador válido.'));
      return launch(id, 'LAUNCH_APP');
    }

    function launchInput(number) {
      if (!native) return preview('LIST_INPUTS');
      if (number !== 2) return Promise.reject(failure('INVALID_TARGET', 'LIST_INPUTS', 'O atalho do PS5 está configurado para HDMI 2.'));
      if (!tizenApi.systeminfo || typeof tizenApi.systeminfo.getPropertyValue !== 'function') {
        return Promise.reject(failure('UNAVAILABLE', 'LIST_INPUTS', stages.LIST_INPUTS));
      }
      if (!tizenApi.tvwindow || typeof tizenApi.tvwindow.setSource !== 'function') {
        return Promise.reject(failure('UNAVAILABLE', 'SET_SOURCE', stages.SET_SOURCE));
      }
      return request('LIST_INPUTS', function (success, error) {
        tizenApi.systeminfo.getPropertyValue('VIDEOSOURCE', success, error);
      }).then(function (sources) {
        if (!sources || !Array.isArray(sources.connected)) {
          throw failure('INVALID_RESPONSE', 'LIST_INPUTS', stages.LIST_INPUTS);
        }
        var matches = sources.connected.filter(function (source) {
          return source && source.type === 'HDMI' && source.number === number;
        });
        if (matches.length !== 1 || matches[0].signal === false) {
          throw failure('INPUT_UNAVAILABLE', 'LIST_INPUTS', 'HDMI 2 não está disponível. Confira o cabo e ligue o PS5.');
        }
        // Use the device's object; do not invent source IDs or choose another input.
        return request('SET_SOURCE', function (success, error) {
          tizenApi.tvwindow.setSource(matches[0], success, error, 'MAIN');
        });
      }).then(function () {
        return launch('org.tizen.tv-viewer', 'LAUNCH_VIEWER').catch(function (error) {
          // The input already changed; do not claim rollback or successful launch.
          throw failure('SOURCE_CHANGED', 'LAUNCH_VIEWER', 'A entrada foi alterada para HDMI 2, mas a TV não confirmou a abertura da imagem. Use o botão Fonte do controle. ' + error.message);
        });
      });
    }

    function exit() {
      if (!native) return preview('EXIT');
      return new Promise(function (resolve, reject) {
        try {
          application.getCurrentApplication().exit();
          resolve();
        } catch (error) {
          reject(nativeFailure('EXIT', error));
        }
      });
    }

    return { native: native, listApps: listApps, launchApp: launchApp, launchInput: launchInput, exit: exit };
  }

  return { create: create };
}));
