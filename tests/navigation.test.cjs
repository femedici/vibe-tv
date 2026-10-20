const test = require('node:test');
const assert = require('node:assert/strict');
const nav = require('../tizen/navigation.js');
const state = require('../tizen/state.js');

function box(id, x, y, width = 100, height = 60) {
  return { id, left: x, top: y, width, height };
}

test('remote arrows follow the row, keep edges, and reach overflowing favorites', () => {
  const boxes = [box('youtube', 0, 100), box('ps5', 120, 100), box('netflix', 240, 100)];
  assert.equal(nav.nextFocus(boxes, 'youtube', 'right'), 'ps5');
  assert.equal(nav.nextFocus(boxes, 'ps5', 'right'), 'netflix');
  assert.equal(nav.nextFocus(boxes, 'youtube', 'left'), 'youtube');
  assert.equal(nav.nextFocus(boxes, 'netflix', 'right'), 'netflix');
});

test('vertical navigation selects the closest aligned control and excludes zero-size controls', () => {
  const boxes = [box('hero', 10, 0, 200), box('youtube', 0, 100), box('ps5', 120, 100), box('hidden', 80, 70, 0, 0)];
  assert.equal(nav.nextFocus(boxes, 'hero', 'down'), 'youtube');
  assert.equal(nav.nextFocus(boxes, 'ps5', 'up'), 'hero');
  assert.equal(nav.nextFocus(boxes, 'missing', 'down'), 'hero');
});

test('Tab navigation wraps within an open panel in both directions', () => {
  assert.equal(nav.tabFocus(['close', 'first', 'last'], 'last', false), 'close');
  assert.equal(nav.tabFocus(['close', 'first', 'last'], 'close', true), 'last');
  assert.equal(nav.tabFocus([], 'close', false), null);
});

test('default app resolution requires one exact normalized inventory name', () => {
  const youtube = { id: 'youtube', name: 'YouTube', kind: 'app', aliases: ['YouTube'] };
  assert.equal(nav.resolveApp(youtube, [{id: 'real.youtube', name: 'YouTube'}]).id, 'real.youtube');
  assert.equal(nav.resolveApp(youtube, [{id: 'other', name: 'YouTube Kids'}]), null);
  assert.equal(nav.resolveApp(youtube, [{id: 'one', name: 'YouTube'}, {id: 'two', name: 'Youtube'}]), null);
  assert.equal(nav.resolveApp(youtube, []), null);
  assert.equal(nav.resolveApp({name: 'Disney+', aliases: ['Disney+']}, [{id: 'plus', name: 'Disney+'}]).id, 'plus');
  assert.equal(nav.resolveApp({name: 'Disney+', aliases: ['Disney+']}, [{id: 'plain', name: 'Disney'}]), null);
});

test('custom apps resolve their actual identity rather than a similar label', () => {
  const custom = {id: 'app:actual', appId: 'actual', name: 'Cinema', kind: 'app'};
  assert.equal(nav.resolveApp(custom, [{id: 'wrong', name: 'Cinema'}]), null);
  assert.equal(nav.resolveApp(custom, [{id: 'actual', name: 'Cinema TV'}]).id, 'actual');
});

test('HDMI shortcut never represents an installed app with the same name', () => {
  const ps5 = {id:'ps5',name:'PS5',kind:'input',aliases:['PS5','PlayStation 5']};
  assert.equal(nav.resolveApp(ps5, [{id:'native.ps5.app',name:'PlayStation 5'}]), null);
});

test('observed consumer app IDs distinguish duplicate Samsung app labels', () => {
  const catalog = state.items(state.defaults());
  const youtube = catalog.find(item => item.id === 'youtube');
  const prime = catalog.find(item => item.id === 'prime');
  const rows = [
    {id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube',iconPath:'/youtube.png'},
    {id:'com.samsung.tv.cobalt-yt',name:'Youtube'},
    {id:'org.tizen.primevideo',name:'Prime Video'},
    {id:'org.tizen.primevideo-dummy',name:'Prime Video'}
  ];
  assert.equal(nav.resolveApp(youtube, rows)?.id, '9Ur5IzDKqV.TizenYouTube');
  assert.equal(nav.resolveApp(prime, rows)?.id, 'org.tizen.primevideo');
  assert.equal(nav.resolveApp(youtube, [{id:'com.samsung.tv.cobalt-yt',name:'Youtube'}]), null);
  assert.equal(nav.resolveApp(prime, [{id:'org.tizen.primevideo-dummy',name:'Prime Video'}]), null);
  assert.equal(nav.resolveApp(youtube, []), null);
  assert.equal(nav.resolveApp(youtube, [{id:'unknown.one',name:'YouTube'},{id:'unknown.two',name:'Youtube'}]), null);
  assert.equal(nav.resolveApp(youtube, [{id:'other.model',name:'YouTube'}]).id, 'other.model');
});

test('Spotify favorite recognizes the exact installed display name', () => {
  const spotify = state.catalog.find(item => item.id === 'spotify');
  assert.equal(nav.resolveApp(spotify, [{id:'rJeHak5zRg.Spotify',name:'Spotify - Music and Podcasts'}])?.id, 'rJeHak5zRg.Spotify');
});

test('vertical movement reaches a wide hero rather than skipping it for the header', () => {
  const boxes = [box('nav-home', 300, 35, 120, 50), box('hero', 90, 150, 1740, 540),
    box('youtube', 90, 800, 200, 150), box('ps5', 310, 800, 200, 150)];
  assert.equal(nav.nextFocus(boxes, 'youtube', 'up'), 'hero');
  assert.equal(nav.nextFocus(boxes, 'hero', 'down'), 'youtube');
});
