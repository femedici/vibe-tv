const test = require('node:test');
const assert = require('node:assert/strict');
const nav = require('../tizen/navigation.js');

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
