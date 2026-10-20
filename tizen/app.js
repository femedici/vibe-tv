(function () {
  'use strict';
  var State = window.VibeState;
  var Navigation = window.VibeNavigation;
  var platform = window.VibePlatform.create(window.tizen);
  var storage;
  try { storage = window.localStorage; } catch (error) { storage = null; }
  var state = State.load(storage);
  var inventory = [];
  var inventoryError = '';
  var loadingInventory = false;
  var pending = null;
  var panelType = null;
  var panelOpener = null;
  var addCandidates = [];
  var toastTimer;
  var focusCounter = 0;
  var themeNames = { dark: 'Escuro', light: 'Claro', gray: 'Cinza', pastel: 'Pastel', wine: 'Vinho' };

  function byId(id) { return document.getElementById(id); }
  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function icon(name) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    node.setAttribute('class', 'icon');
    node.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-' + name);
    node.appendChild(use);
    return node;
  }
  function actionButton(id, className, action, label, iconName) {
    var button = element('button', className);
    button.type = 'button';
    button.id = id;
    button.dataset.action = action;
    if (iconName) button.appendChild(icon(iconName));
    if (label) button.appendChild(document.createTextNode(label));
    return button;
  }
  function itemById(id) {
    return State.items(state).filter(function (item) { return item.id === id; })[0];
  }
  function brand(item) {
    if (item.id === 'ps5') {
      var image = element('img', 'ps5-tile-logo');
      image.src = 'assets/ps5-logo.png';
      image.alt = '';
      return image;
    }
    var kind = item.appId ? 'custom' : item.id;
    var node = element('span', 'brand brand-' + kind);
    if (kind === 'youtube') {
      node.appendChild(element('i'));
      node.appendChild(document.createTextNode('YouTube'));
    } else if (kind === 'max') {
      node.appendChild(element('small', '', 'HBO'));
      node.appendChild(document.createTextNode('max'));
    } else if (kind === 'samsung') {
      node.appendChild(element('small', '', 'SAMSUNG'));
      node.appendChild(document.createTextNode('TV Plus'));
    } else if (kind === 'spotify') {
      var glyph = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      glyph.setAttribute('viewBox', '0 0 32 32');
      glyph.innerHTML = '<circle cx="16" cy="16" r="15" fill="currentColor"/><path d="M8 12c6-2 11-1.5 16 1M9 17c5-1.6 10-1 14 1M10 22c4-1.1 8-.8 11 .8" fill="none" stroke="#19251f" stroke-width="2" stroke-linecap="round"/>';
      node.appendChild(glyph);
      node.appendChild(document.createTextNode('Spotify'));
    } else {
      var labels = { netflix: 'NETFLIX', prime: 'prime video', disney: 'Disney+' };
      node.textContent = labels[kind] || item.name.split(/\s+/).map(function (part) { return part.charAt(0); }).slice(0, 2).join('').toUpperCase();
    }
    return node;
  }
  function announce(message) {
    window.clearTimeout(toastTimer);
    var toast = byId('toast');
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 7000);
  }
  function focus(id) {
    var target = byId(id);
    if (!target || target.disabled) return;
    target.focus();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }
  function commit(nextState, message) {
    state = nextState;
    var saved = State.save(storage, state);
    render();
    if (!saved) {
      byId('storage-note').textContent = 'Armazenamento indisponível. Suas escolhas valem apenas nesta sessão.';
      announce('Alteração aplicada nesta sessão. Este dispositivo não permitiu salvar suas escolhas.');
    } else {
      byId('storage-note').textContent = 'Sua ordem. Seus favoritos. Salvos neste dispositivo.';
      if (message) announce(message);
    }
    return saved;
  }
  function renderHero() {
    var last = state.last && itemById(state.last.id);
    var title = byId('hero-title');
    var action = byId('hero-open');
    var visual = byId('hero-visual');
    title.className = last && last.name.length > 18 ? 'long-title' : '';
    if (!last) {
      title.textContent = 'Sua TV.';
      title.appendChild(element('br'));
      title.appendChild(document.createTextNode('Do seu jeito.'));
      byId('hero-description').textContent = 'Abra um app para começar. Seu último acesso pelo Vibe TV aparece aqui.';
      byId('hero-action-label').textContent = 'Escolher um app';
      byId('hero-note-text').textContent = 'Seu histórico começa aqui.';
      action.dataset.action = 'choose';
      action.removeAttribute('data-id');
      byId('hero-art').className = 'hero-art art-ps5';
      visual.textContent = '';
      visual.appendChild(element('span', 'art-caption', 'SUA ARTE · PLAYSTATION 5'));
      var ps5Logo = brand({ id: 'ps5' });
      ps5Logo.className = 'ps5-hero-logo';
      visual.appendChild(ps5Logo);
      return;
    }
    title.textContent = last.name;
    byId('hero-description').textContent = last.kind === 'input' ? 'Seu espaço para jogar. Volte para o PS5 conectado à entrada HDMI 2.' : 'Volte ao aplicativo. Seus vídeos, séries e músicas continuam por lá.';
    byId('hero-action-label').textContent = last.kind === 'input' ? 'Ir para o PS5' : 'Abrir ' + last.name;
    var time = new Date(state.last.at);
    byId('hero-note-text').textContent = 'Aberto pelo Vibe TV · ' + time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    action.dataset.action = 'launch';
    action.dataset.id = last.id;
    byId('hero-art').className = 'hero-art art-' + (last.appId ? 'custom' : last.id);
    visual.textContent = '';
    visual.appendChild(element('span', 'art-caption', last.kind === 'input' ? 'PLAYSTATION 5 · HDMI 2' : 'SEU ÚLTIMO APLICATIVO'));
    var logo = brand(last);
    if (last.id === 'ps5') logo.className = 'ps5-hero-logo';
    visual.appendChild(logo);
  }
  function renderShelf() {
    var items = State.items(state);
    var list = byId('favorites');
    var oldScroll = list.scrollLeft;
    list.textContent = '';
    byId('favorite-count').textContent = String(items.length).padStart(2, '0');
    byId('empty-favorites').hidden = items.length > 0;
    items.forEach(function (item) {
      var row = element('li', 'favorite');
      var button = actionButton('favorite-' + item.id, 'app-button', 'launch');
      button.dataset.id = item.id;
      var available = platform.native && (item.kind === 'input' || Navigation.resolveApp(item, inventory));
      var description = !platform.native ? 'Disponibilidade não verificada nesta prévia.' : item.kind === 'input' ? 'Disponibilidade será verificada ao abrir.' : available ? 'Abrir na TV.' : 'Aplicativo não encontrado no inventário.';
      button.setAttribute('aria-label', item.name + '. ' + (item.kind === 'input' ? 'Entrada HDMI 2. ' : '') + description);
      if (pending === item.id) button.setAttribute('aria-busy', 'true');
      var tile = element('span', 'app-tile tile-' + (item.appId ? 'custom' : item.id));
      tile.setAttribute('aria-hidden', 'true');
      tile.appendChild(brand(item));
      button.appendChild(tile);
      button.appendChild(element('span', 'app-label', item.name));
      button.appendChild(element('span', 'app-kind', item.kind === 'input' ? 'HDMI 2' : platform.native && !available ? 'Não encontrado' : 'Aplicativo'));
      row.appendChild(button);
      list.appendChild(row);
    });
    list.scrollLeft = oldScroll;
  }
  function render() {
    var focused = document.activeElement && document.activeElement.id;
    document.body.setAttribute('data-theme', state.theme);
    renderHero();
    renderShelf();
    if (panelType) renderPanel();
    if (focused && byId(focused) && !byId(focused).disabled) focus(focused);
  }
  function openPanel(type, opener) {
    panelOpener = opener || document.activeElement.id;
    panelType = type;
    renderPanel();
    byId('panel-overlay').hidden = false;
    document.body.classList.add('panel-open');
    focus('panel-close');
    byId('hub').setAttribute('aria-hidden', 'true');
  }
  function closePanel() {
    var opener = panelOpener;
    panelType = null;
    byId('panel-overlay').hidden = true;
    document.body.classList.remove('panel-open');
    byId('hub').removeAttribute('aria-hidden');
    if (opener && byId(opener)) focus(opener);
    else focus('nav-home');
  }
  function detail(container, title, copy) {
    var section = element('section', 'detail-section');
    section.appendChild(element('h3', '', title));
    section.appendChild(element('p', '', copy));
    container.appendChild(section);
    return section;
  }
  function renderThemes(container) {
    container.appendChild(element('p', 'panel-intro', 'Uma cor para cada momento. Escolha o clima da sua TV.'));
    var grid = element('div', 'themes');
    State.themes.forEach(function (theme) {
      var choice = actionButton('theme-' + theme, 'theme-choice', 'theme');
      choice.dataset.theme = theme;
      choice.setAttribute('aria-pressed', String(theme === state.theme));
      var swatch = element('span', 'theme-preview theme-' + theme);
      swatch.setAttribute('aria-hidden', 'true');
      choice.appendChild(swatch);
      var label = element('span', 'theme-label', themeNames[theme]);
      if (theme === state.theme) label.appendChild(icon('check'));
      choice.appendChild(label);
      grid.appendChild(choice);
    });
    container.appendChild(grid);
  }
  function renderOrganize(container) {
    container.appendChild(element('p', 'panel-intro', 'Deixe seus favoritos por perto. Mude a ordem ou retire um atalho; o aplicativo continua instalado.'));
    var items = State.items(state);
    var list = element('ol', 'organize-list');
    items.forEach(function (item, index) {
      var row = element('li', 'organize-row');
      row.appendChild(element('span', 'order-number', String(index + 1).padStart(2, '0')));
      row.appendChild(element('span', 'organize-name', item.name));
      [-1, 1].forEach(function (direction) {
        var button = actionButton((direction < 0 ? 'before-' : 'after-') + item.id, 'icon-button ' + (direction < 0 ? 'move-before' : 'move-after'), 'move', null, 'arrow');
        button.dataset.id = item.id;
        button.dataset.delta = String(direction);
        button.disabled = direction < 0 ? index === 0 : index === items.length - 1;
        button.setAttribute('aria-label', 'Mover ' + item.name + (direction < 0 ? ' para antes' : ' para depois'));
        row.appendChild(button);
      });
      var remove = actionButton('remove-' + item.id, 'icon-button', 'remove', null, 'trash');
      remove.dataset.id = item.id;
      remove.setAttribute('aria-label', 'Remover ' + item.name + ' dos favoritos');
      row.appendChild(remove);
      list.appendChild(row);
    });
    container.appendChild(list);
    if (!items.length) container.appendChild(element('p', 'panel-empty', 'Nenhum favorito por enquanto. Use Adicionar para montar sua prateleira.'));
  }
  function candidates() {
    var favorites = State.items(state);
    var ids = favorites.map(function (item) { return item.id; });
    if (!platform.native) return State.catalog.filter(function (item) { return ids.indexOf(item.id) < 0; });
    var represented = favorites.map(function (item) { var app = Navigation.resolveApp(item, inventory); return app && app.id; });
    var result = inventory.filter(function (app) { return represented.indexOf(app.id) < 0; }).map(function (app) {
      var known = State.catalog.filter(function (item) {
        var match = item.kind === 'app' && Navigation.resolveApp(item, inventory);
        return ids.indexOf(item.id) < 0 && match && match.id === app.id;
      })[0];
      return known || { id: 'app:' + app.id, name: app.name, kind: 'app', appId: app.id };
    });
    if (ids.indexOf('ps5') < 0) result.unshift(State.catalog.filter(function (item) { return item.id === 'ps5'; })[0]);
    return result;
  }
  function renderAdd(container) {
    container.appendChild(element('p', 'panel-intro', platform.native ? 'Adicione aplicativos encontrados nesta TV ou restaure o atalho do PS5.' : 'Nesta prévia, você pode restaurar atalhos removidos. Na TV, esta lista mostrará os aplicativos realmente instalados.'));
    addCandidates = candidates();
    var list = element('ul', 'add-list');
    addCandidates.forEach(function (item, index) {
      var row = element('li');
      var add = actionButton('add-item-' + index, 'add-choice', 'add', null, 'plus');
      add.dataset.index = String(index);
      var label = element('span', '', item.name);
      label.appendChild(element('small', '', item.kind === 'input' ? 'Restaurar atalho · HDMI 2' : platform.native ? 'Encontrado nesta TV' : 'Restaurar atalho da prévia'));
      add.appendChild(label);
      row.appendChild(add);
      list.appendChild(row);
    });
    container.appendChild(list);
    if (!addCandidates.length) container.appendChild(element('p', 'panel-empty', loadingInventory ? 'Consultando os aplicativos da TV…' : platform.native ? 'Nenhum outro aplicativo disponível para adicionar.' : 'Todos os atalhos iniciais já estão na sua prateleira.'));
    if (platform.native) {
      if (inventoryError) container.appendChild(element('p', 'panel-empty', inventoryError));
      var refresh = actionButton('refresh-inventory', 'button quiet', 'refresh', loadingInventory ? 'Consultando…' : 'Atualizar aplicativos');
      refresh.disabled = loadingInventory;
      container.appendChild(refresh);
    }
  }
  function renderPanel() {
    var titles = { themes: 'Encontre sua vibe.', organize: 'Na sua ordem.', add: 'Mais na sua TV.', settings: 'Sua TV continua sua.', about: 'De volta ao que importa.', exit: 'Sair do Vibe TV?' };
    byId('panel-title').textContent = titles[panelType] || '';
    byId('panel-eyebrow').textContent = panelType === 'themes' ? 'APARÊNCIA' : panelType === 'organize' ? 'SEUS FAVORITOS' : panelType === 'add' ? 'ADICIONAR APLICATIVOS' : panelType === 'exit' ? 'ATÉ JÁ' : 'COMO FUNCIONA';
    var content = byId('panel-content');
    content.textContent = '';
    if (panelType === 'themes') return renderThemes(content);
    if (panelType === 'organize') return renderOrganize(content);
    if (panelType === 'add') return renderAdd(content);
    if (panelType === 'exit') {
      content.appendChild(element('p', 'panel-intro', 'O Vibe TV será fechado. Seus favoritos e seu tema ficam salvos quando o armazenamento está disponível.'));
      content.appendChild(actionButton('confirm-exit', 'button primary', 'exit', 'Sair do Vibe TV'));
      content.appendChild(actionButton('cancel-exit', 'button quiet', 'close', 'Continuar aqui'));
      return;
    }
    if (panelType === 'about') {
      detail(content, 'Seu último acesso, em destaque', 'O app que você abriu com sucesso pelo Vibe TV ocupa a tela principal. Acessos feitos fora deste hub não entram no histórico.');
      detail(content, 'Continue dentro do aplicativo', 'Netflix, YouTube e os outros serviços mantêm a própria experiência. Retomar episódios, ver progresso ou mostrar a arte do que você assistiu exige uma integração oficial ainda indisponível.');
      detail(content, 'Seu PS5 tem lugar aqui', 'O atalho usa a entrada HDMI 2 e as artes que você escolheu. A troca de entrada e a imagem do console precisam ser verificadas na TV.');
      if (!platform.native) detail(content, 'Você está na prévia local', 'Explore os temas e organize os atalhos. Abrir um app aqui não envia comandos para a TV nem cria um acesso fictício.');
      return;
    }
    detail(content, 'Configurações da Samsung', 'Use Home no controle para acessar o Smart Hub e as configurações da TV: imagem, som, Wi-Fi, conexões e contas. Home, volume e energia continuam sob controle da Samsung.');
    detail(content, 'Seus aplicativos e acessos', 'O Vibe TV abre os aplicativos existentes. Não lê suas senhas, não migra contas e não altera as configurações dos serviços. A preservação das sessões ainda precisa ser validada na TV.');
    detail(content, 'Ao ligar a TV', 'Este é um aplicativo separado. Ele não substitui o Smart Hub e não há garantia de abertura automática ao ligar a televisão.');
    detail(content, 'Retomar um episódio', 'A retomada acontece dentro de cada aplicativo. O Vibe TV não tem acesso ao seu histórico de séries, vídeos ou jogos.');
    if (!platform.native) detail(content, 'Prévia local · instalação pendente', 'A instalação na TV está bloqueada até resolver o requisito de backup e recuperação. Nenhum backup integral do sistema ou das sessões foi criado.');
    if (platform.native) {
      var exitSection = detail(content, 'Voltar à televisão', 'Fechar este hub preserva os aplicativos e as configurações nativas.');
      var exit = actionButton('settings-exit', 'button quiet', 'panel', 'Sair do Vibe TV');
      exit.dataset.panel = 'exit';
      exitSection.appendChild(exit);
    }
  }
  function refreshInventory(manual) {
    if (!platform.native || loadingInventory) return;
    loadingInventory = true;
    if (panelType === 'add') renderPanel();
    platform.listApps().then(function (apps) {
      inventory = apps;
      inventoryError = '';
      if (manual) announce('Lista de aplicativos atualizada.');
    }, function (error) {
      inventory = [];
      inventoryError = error.message || 'Não foi possível consultar os aplicativos.';
      if (manual) announce(inventoryError);
    }).then(function () {
      loadingInventory = false;
      render();
    });
  }
  function launch(item) {
    if (!item) return;
    if (!platform.native) {
      announce('Prévia local: abrir ' + item.name + ' depende da TV. Nenhum acesso foi registrado.');
      return;
    }
    if (pending) { announce('Aguarde a confirmação da abertura em andamento.'); return; }
    if (loadingInventory && item.kind === 'app') { announce('Aguarde a consulta dos aplicativos da TV.'); return; }
    var target = item.kind === 'app' && Navigation.resolveApp(item, inventory);
    if (item.kind === 'app' && !target) { announce(item.name + ' não foi identificado com segurança nesta TV. Confira os aplicativos em Adicionar.'); return; }
    pending = item.id;
    renderShelf();
    announce('Abrindo ' + item.name + '…');
    var request = item.kind === 'input' ? platform.launchInput(2) : platform.launchApp(target.id);
    request.then(function () {
      pending = null;
      commit(State.recordLaunch(state, item.id, Date.now()), 'Abertura de ' + item.name + ' confirmada pela TV.');
    }, function (error) {
      pending = null;
      renderShelf();
      focus('favorite-' + item.id);
      announce(error.message || 'Não foi possível abrir ' + item.name + '.');
    });
  }
  function handleAction(button) {
    var action = button.dataset.action;
    var item = itemById(button.dataset.id);
    if (action === 'home' || action === 'choose') {
      var first = State.items(state)[0];
      focus(first ? 'favorite-' + first.id : 'add-button');
    } else if (action === 'panel') openPanel(button.dataset.panel, button.id);
    else if (action === 'close') closePanel();
    else if (action === 'launch') launch(item);
    else if (action === 'theme') {
      commit(State.setTheme(state, button.dataset.theme));
      focus('theme-' + state.theme);
    } else if (action === 'move' && item) {
      var direction = Number(button.dataset.delta);
      var saved = commit(State.move(state, item.id, direction));
      var same = byId(button.id);
      focus(same && !same.disabled ? button.id : (direction < 0 ? 'after-' : 'before-') + item.id);
      if (saved) announce(item.name + ' agora está na posição ' + (state.order.indexOf(item.id) + 1) + '.');
    } else if (action === 'remove' && item) {
      var position = state.order.indexOf(item.id);
      commit(State.remove(state, item.id), item.name + ' removido dos favoritos. O aplicativo foi preservado.');
      var next = state.order[Math.min(position, state.order.length - 1)];
      focus(next ? 'remove-' + next : 'panel-close');
    } else if (action === 'add') {
      var added = addCandidates[Number(button.dataset.index)];
      if (!added) return;
      commit(State.add(state, added), added.name + ' adicionado aos favoritos.');
      focus(addCandidates.length ? 'add-item-0' : 'panel-close');
    } else if (action === 'refresh') refreshInventory(true);
    else if (action === 'exit') platform.exit().catch(function (error) { announce(error.message || 'Não foi possível sair.'); });
  }
  function focusable() {
    var scope = panelType ? byId('panel') : byId('hub');
    return Array.prototype.slice.call(scope.querySelectorAll('button:not([disabled])')).filter(function (button) {
      var rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-action]');
    if (button && !button.disabled) handleAction(button);
    else if (event.target === byId('panel-overlay')) closePanel();
  });
  document.addEventListener('keydown', function (event) {
    var key = event.key;
    var code = event.keyCode;
    if (key === 'Escape' || key === 'Backspace' || code === 10009) {
      event.preventDefault();
      if (panelType) closePanel();
      else if (platform.native) openPanel('exit');
      else { focus('nav-home'); announce('Você está no início da prévia. Home no controle continua abrindo o Smart Hub.'); }
      return;
    }
    var buttons = focusable();
    if (key === 'Tab' && panelType) {
      event.preventDefault();
      focus(Navigation.tabFocus(buttons.map(function (button) { return button.id; }), document.activeElement.id, event.shiftKey));
      return;
    }
    var directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', 37: 'left', 39: 'right', 38: 'up', 40: 'down' };
    var direction = directions[key] || directions[code];
    if (direction) {
      event.preventDefault();
      var rectangles = buttons.map(function (button) {
        if (!button.id) button.id = 'focus-' + (++focusCounter);
        var rect = button.getBoundingClientRect();
        return { id: button.id, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      });
      focus(Navigation.nextFocus(rectangles, document.activeElement.id, direction));
    } else if ((key === 'Enter' || code === 13) && document.activeElement.tagName === 'BUTTON') {
      event.preventDefault();
      if (!event.repeat) document.activeElement.click();
    }
  });
  document.addEventListener('focusin', function (event) {
    if (panelType && !byId('panel').contains(event.target)) focus('panel-close');
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) refreshInventory(false);
  });
  function clock() {
    var now = new Date();
    byId('clock').textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    byId('clock').dateTime = now.toISOString();
  }
  byId('preview-badge').hidden = platform.native;
  render();
  clock();
  window.setInterval(clock, 60000);
  refreshInventory(false);
  focus('hero-open');
}());
