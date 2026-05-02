import { el, navTo, shuffle } from '../dom.js';
import { getGame, getPlayers, clearGame, saveGame } from '../state.js';
import { posterUrl } from '../api.js';

export const renderResults = (root) => {
  const game = getGame();
  if (!game) { navTo('/'); return; }
  const players = getPlayers();
  const playerById = (id) => players.find(p => p.id === id);

  const sorted = [...game.playerOrder].sort(
    (a, b) => (game.scores[b] || 0) - (game.scores[a] || 0)
  );

  const allSlips = [
    ...game.drawn.map(d => d.slip),
    ...game.skipped,
    ...game.remaining,
  ];

  const playAgainSame = () => {
    saveGame({
      playerOrder: shuffle(game.playerOrder),
      currentPlayerIdx: 0,
      remaining: shuffle(allSlips),
      drawn: [],
      skipped: [],
      scores: Object.fromEntries(game.playerOrder.map(id => [id, 0])),
      timerSeconds: game.timerSeconds,
      phase: 'ready',
    });
    navTo('/play');
  };

  const goHome = () => { clearGame(); navTo('/'); };

  const guessedThumbs = game.drawn.length === 0
    ? null
    : el('section', { class: 'card' }, [
        el('h2', {}, `Gættede sedler (${game.drawn.length})`),
        el('ul', { class: 'slip-grid mini' },
          game.drawn.map(d => el('li', { class: 'slip-card' }, [
            el('img', { src: posterUrl(d.slip.posterPath, 'w185'), alt: '', loading: 'lazy' }),
            el('div', { class: 'slip-title' }, d.slip.title),
          ]))
        ),
      ]);

  root.appendChild(el('div', { class: 'view results' }, [
    el('header', { class: 'topbar' }, [
      el('h1', {}, '🏆 Resultat'),
    ]),
    el('section', { class: 'card' }, [
      el('ol', { class: 'leaderboard' },
        sorted.map((id, i) => {
          const p = playerById(id);
          return el('li', { class: 'lb-row' + (i === 0 ? ' winner' : '') }, [
            el('span', { class: 'rank' }, '#' + (i + 1)),
            el('span', { class: 'avatar' }, p.kidMode ? '🧒' : '🙂'),
            el('span', { class: 'name' }, p.name),
            el('strong', {}, String(game.scores[id] || 0)),
          ]);
        })
      ),
    ]),
    guessedThumbs,
    el('section', { class: 'actions' }, [
      el('button', { class: 'btn big accent', on: { click: playAgainSame } }, 'Spil igen 🥣'),
      el('button', { class: 'btn quiet', on: { click: goHome } }, 'Hjem'),
    ]),
  ]));
};
