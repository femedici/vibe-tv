(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VibeState = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var key = 'vibe-tv.preferences.v1';
  var catalog = [
    {id: 'youtube', name: 'YouTube', kind: 'app', aliases: ['YouTube'], preferredAppIds: ['9Ur5IzDKqV.TizenYouTube'], excludedAppIds: ['com.samsung.tv.cobalt-yt']},
    {id: 'ps5', name: 'PS5', kind: 'input', input: 2, aliases: ['PS5', 'PlayStation 5']},
    {id: 'netflix', name: 'Netflix', kind: 'app', aliases: ['Netflix']},
    {id: 'prime', name: 'Prime Video', kind: 'app', aliases: ['Prime Video', 'Amazon Prime Video'], preferredAppIds: ['org.tizen.primevideo'], excludedAppIds: ['org.tizen.primevideo-dummy']},
    {id: 'max', name: 'HBO Max', kind: 'app', aliases: ['HBO Max', 'Max']},
    {id: 'samsung', name: 'Samsung TV Plus', kind: 'app', aliases: ['Samsung TV Plus', 'TV Plus']},
    {id: 'disney', name: 'Disney+', kind: 'app', aliases: ['Disney+', 'Disney Plus']},
    {id: 'spotify', name: 'Spotify', kind: 'app', aliases: ['Spotify', 'Spotify - Music and Podcasts']}
  ];
  var themes = Object.freeze(['dark', 'light', 'gray', 'pastel', 'wine']);
  var byId = Object.create(null);
  catalog.forEach(function (item) {
    Object.freeze(item.aliases);
    if (item.preferredAppIds) Object.freeze(item.preferredAppIds);
    if (item.excludedAppIds) Object.freeze(item.excludedAppIds);
    byId[item.id] = Object.freeze(item);
  });
  Object.freeze(catalog);

  function defaults() {
    return {version: 1, theme: 'dark', order: catalog.map(function (item) { return item.id; }), custom: [], last: null};
  }

  function object(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function text(value, limit) {
    if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return '';
    value = value.trim();
    return value.length > 0 && value.length <= limit ? value : '';
  }

  function customItem(value) {
    if (!object(value) || value.kind !== 'app') return null;
    var appId = text(value.appId, 256);
    var name = text(value.name, 120);
    if (!appId || !/^[A-Za-z0-9_.-]+$/.test(appId) || !name || value.id !== 'app:' + appId) return null;
    var item = {id: 'app:' + appId, name: name, kind: 'app', appId: appId};
    var icon = text(value.iconPath, 2048);
    if (icon && icon.indexOf('\\') < 0 && (/^\/(?!\/)/.test(icon) || /^file:\/\/\/(?!\/)/.test(icon))) item.iconPath = icon;
    return item;
  }

  function timestamp(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function sanitize(value) {
    if (!object(value) || value.version !== 1) return defaults();
    var clean = defaults();
    if (themes.indexOf(value.theme) !== -1) clean.theme = value.theme;
    var available = Object.create(null);
    catalog.forEach(function (item) { available[item.id] = item; });
    if (Array.isArray(value.custom)) value.custom.forEach(function (candidate) {
      var item = customItem(candidate);
      if (item && !available[item.id]) {
        available[item.id] = item;
        clean.custom.push(item);
      }
    });
    if (Array.isArray(value.order)) {
      clean.order = [];
      value.order.forEach(function (id) {
        if (typeof id === 'string' && available[id] && clean.order.indexOf(id) === -1) clean.order.push(id);
      });
    }
    clean.custom = clean.custom.filter(function (item) { return clean.order.indexOf(item.id) !== -1; });
    if (object(value.last) && clean.order.indexOf(value.last.id) !== -1 && timestamp(value.last.at)) {
      clean.last = {id: value.last.id, at: value.last.at};
    }
    return clean;
  }

  function items(value) {
    var state = sanitize(value);
    return state.order.map(function (id) {
      var item = byId[id];
      if (item) return Object.assign({}, item, {aliases: item.aliases.slice()});
      return state.custom.find(function (entry) { return entry.id === id; });
    });
  }

  function load(storage) {
    try { return sanitize(JSON.parse(storage.getItem(key))); }
    catch (error) { return defaults(); }
  }

  function save(storage, value) {
    try {
      if (!object(value)) return false;
      var clean = sanitize(value);
      var fields = {
        version: value.version, theme: value.theme, order: value.order,
        custom: Array.isArray(value.custom) ? value.custom.map(customItem) : value.custom,
        last: object(value.last) ? {id: value.last.id, at: value.last.at} : value.last
      };
      // A malformed write must not replace the last valid stored preferences.
      if (JSON.stringify(fields) !== JSON.stringify(clean)) return false;
      storage.setItem(key, JSON.stringify(clean));
      return true;
    } catch (error) { return false; }
  }

  function setTheme(value, theme) {
    var state = sanitize(value);
    if (themes.indexOf(theme) !== -1) state.theme = theme;
    return state;
  }

  function move(value, id, delta) {
    var state = sanitize(value);
    var from = state.order.indexOf(id);
    if (from === -1 || !Number.isSafeInteger(delta)) return state;
    var to = Math.max(0, Math.min(state.order.length - 1, from + delta));
    state.order.splice(from, 1);
    state.order.splice(to, 0, id);
    return state;
  }

  function add(value, candidate) {
    var state = sanitize(value);
    if (!object(candidate) || typeof candidate.id !== 'string') return state;
    var item = byId[candidate.id] || customItem(candidate);
    if (!item || state.order.indexOf(item.id) !== -1) return state;
    state.order.push(item.id);
    if (!byId[item.id]) state.custom.push(item);
    return state;
  }

  function remove(value, id) {
    var state = sanitize(value);
    state.order = state.order.filter(function (entry) { return entry !== id; });
    state.custom = state.custom.filter(function (item) { return item.id !== id; });
    if (state.last && state.last.id === id) state.last = null;
    return state;
  }

  function recordLaunch(value, id, time) {
    var state = sanitize(value);
    if (state.order.indexOf(id) !== -1 && timestamp(time)) state.last = {id: id, at: time};
    return state;
  }

  return {
    catalog: catalog, themes: themes, defaults: defaults, items: items, load: load, save: save,
    setTheme: setTheme, move: move, add: add, remove: remove, recordLaunch: recordLaunch
  };
}));
