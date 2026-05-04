import { el, navTo, shuffle } from '../dom.js';
import { getGame, saveGame, getPlayers, getSettings, clearGame } from '../state.js';
import { posterUrl } from '../api.js';

export const renderPlay = (root) => {
  let game = getGame();
  if (!game) { navTo('/'); return; }
  const players = getPlayers();
  const settings = getSettings();
  const playerById = (id) => players.find(p => p.id === id);

  let timerHandle = null;
  let timerLeft = game.timerSeconds;
  let timerEl = null;

  const stopTimer = () => {
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
  };

  const persist = () => saveGame(game);

  const refillFromSkipped = () => {
    if (game.remaining.length === 0 && game.skipped.length > 0) {
      game.remaining = shuffle(game.skipped);
      game.skipped = [];
    }
  };

  const goResults = () => {
    stopTimer();
    game.phase = 'done';
    persist();
    navTo('/results');
  };

  const startTurn = () => {
    refillFromSkipped();
    if (game.remaining.length === 0) return goResults();
    game.phase = 'active';
    timerLeft = game.timerSeconds;
    persist();
    render();
  };

  const advanceToNextPlayer = () => {
    game.currentPlayerIdx = (game.currentPlayerIdx + 1) % game.playerOrder.length;
    game.phase = 'ready';
    timerLeft = game.timerSeconds;
    persist();
    render();
  };

  const endTurn = () => {
    stopTimer();
    refillFromSkipped();
    if (game.remaining.length === 0) return goResults();
    game.phase = 'handoff';
    persist();
    render();
  };

  const onGuessed = () => {
    if (game.remaining.length === 0) return;
    const slip = game.remaining.shift();
    const pid = game.playerOrder[game.currentPlayerIdx];
    game.drawn.push({ slip, guessedBy: pid });
    game.scores[pid] = (game.scores[pid] || 0) + 1;
    if (game.remaining.length === 0) {
      if (game.skipped.length === 0) return goResults();
      game.remaining = shuffle(game.skipped);
      game.skipped = [];
    }
    persist();
    render();
  };

  const onSkip = () => {
    if (game.remaining.length === 0) return;
    const slip = game.remaining.shift();
    game.skipped.push(slip);
    if (game.remaining.length === 0) {
      game.remaining = shuffle(game.skipped);
      game.skipped = [];
    }
    persist();
    render();
  };

  const tick = () => {
    timerLeft -= 1;
    if (timerLeft <= 0) {
      if (timerEl) timerEl.textContent = '0s';
      endTurn();
      return;
    }
    if (timerEl) timerEl.textContent = `${timerLeft}s`;
  };

  const startInterval = () => {
    stopTimer();
    timerHandle = setInterval(tick, 1000);
  };

  const renderHandoff = (currentPlayer) => {
    const isFirstTurn = game.drawn.length === 0;
    const remaining = game.remaining.length + game.skipped.length;

    root.appendChild(el('div', { class: 'view play handoff' }, [
      el('div', { class: 'handoff-card' }, [
        el('div', { class: 'avatar big' }, currentPlayer.kidMode ? '🧒' : '🙂'),
        el('h1', {}, currentPlayer.name),
        el('p', { class: 'sub' }, isFirstTurn ? 'klar?' : 'din tur — andre skal kigge væk'),
        el('p', { class: 'sub small' }, `${remaining} ${remaining === 1 ? 'seddel' : 'sedler'} tilbage · ${game.timerSeconds}s pr. tur`),
        el('button', {
          class: 'btn big accent',
          on: { click: () => game.phase === 'handoff' ? advanceToNextPlayer() : startTurn() },
        }, game.phase === 'handoff' ? 'Tap når næste er klar' : 'Tap for at starte'),
      ]),
      el('div', { class: 'scoreboard' },
        game.playerOrder.map(id => {
          const p = playerById(id);
          return el('div', { class: 'score-pill' + (id === currentPlayer.id ? ' current' : '') }, [
            el('span', {}, p.name),
            el('strong', {}, String(game.scores[id] || 0)),
          ]);
        })
      ),
      el('button', {
        class: 'btn quiet',
        on: { click: () => {
          if (confirm('Afslut spillet og gå til resultater?')) goResults();
        } },
      }, 'Afslut runden'),
    ]));
  };

  const renderActive = (currentPlayer) => {
    const slip = game.remaining[0];
    const hideTitle = currentPlayer.kidMode && settings.hideTitleForKids;
    const remaining = game.remaining.length + game.skipped.length;
    timerEl = el('div', { class: 'timer' }, `${timerLeft}s`);

    const skipBtn = el('button', {
      class: 'btn skip big',
      disabled: true,
      on: { click: onSkip },
    }, '⤼ Spring');
    const guessBtn = el('button', {
      class: 'btn primary big',
      disabled: true,
      on: { click: onGuessed },
    }, '✓ Gættet');

    root.appendChild(el('div', { class: 'view play active' }, [
      el('header', { class: 'play-top' }, [
        el('button', {
          class: 'icon-btn end-turn',
          'aria-label': 'Afslut tur',
          on: { click: endTurn },
        }, '✕'),
        el('span', { class: 'now-playing' }, currentPlayer.name),
        timerEl,
        el('span', { class: 'remaining' }, String(remaining)),
      ]),
      el('div', { class: 'card-stage' }, [
        el('img', {
          class: 'poster',
          src: posterUrl(slip.posterPath, 'w500'),
          alt: hideTitle ? '' : slip.title,
        }),
        hideTitle ? null : el('div', { class: 'card-title' }, slip.title),
      ]),
      el('div', { class: 'play-actions' }, [skipBtn, guessBtn]),
    ]));

    setTimeout(() => {
      skipBtn.disabled = false;
      guessBtn.disabled = false;
    }, 1000);

    startInterval();
  };

  const render = () => {
    stopTimer();
    root.replaceChildren();
    const currentPlayer = playerById(game.playerOrder[game.currentPlayerIdx]);
    if (!currentPlayer) { clearGame(); navTo('/'); return; }

    if (game.phase === 'ready' || game.phase === 'handoff') {
      renderHandoff(currentPlayer);
    } else if (game.phase === 'active') {
      renderActive(currentPlayer);
    } else {
      navTo('/results');
    }
  };

  window.addEventListener('hashchange', stopTimer, { once: true });
  render();
};
