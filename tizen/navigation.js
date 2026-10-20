(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VibeNavigation = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function nextFocus(rectangles, currentId, direction) {
    var boxes = rectangles.filter(function (box) { return box.width > 0 && box.height > 0; });
    var current = boxes.filter(function (box) { return box.id === currentId; })[0];
    if (!current) return boxes.length ? boxes[0].id : null;
    var horizontal = direction === 'left' || direction === 'right';
    var forward = direction === 'right' || direction === 'down';
    var best = currentId;
    var distance = Infinity;
    boxes.forEach(function (box) {
      if (box.id === currentId) return;
      var dx = box.left + box.width / 2 - current.left - current.width / 2;
      var dy = box.top + box.height / 2 - current.top - current.height / 2;
      if (horizontal) {
        if (Math.min(box.top + box.height, current.top + current.height) <= Math.max(box.top, current.top)) return;
        if (forward ? dx <= 1 : dx >= -1) return;
      } else {
        if (forward ? box.top < current.top + current.height - 2 : box.top + box.height > current.top + 2) return;
      }
      var score = horizontal ? Math.abs(dx) : Math.abs(dy) + Math.abs(dx) * 0.8;
      if (score < distance) { best = box.id; distance = score; }
    });
    return best;
  }

  function tabFocus(ids, currentId, backwards) {
    if (!ids.length) return null;
    var index = ids.indexOf(currentId);
    if (index < 0) return backwards ? ids[ids.length - 1] : ids[0];
    return ids[(index + (backwards ? -1 : 1) + ids.length) % ids.length];
  }

  function normalize(name) {
    return String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function resolveApp(item, inventory) {
    if (!item || item.kind === 'input' || !Array.isArray(inventory)) return null;
    var aliases = (item.aliases || [item.name]).map(normalize);
    var matches = inventory.filter(function (app) {
      return item.appId ? app.id === item.appId : aliases.indexOf(normalize(app.name)) !== -1;
    });
    return matches.length === 1 ? matches[0] : null;
  }

  return { nextFocus: nextFocus, tabFocus: tabFocus, resolveApp: resolveApp };
}));
