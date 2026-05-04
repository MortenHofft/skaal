import { el, navTo } from '../dom.js';
import { getPlayers, getSettings, saveSettings, uid, upsertPlayer, removePlayer } from '../state.js';

export const renderHome = (root) => {
  const render = () => {
    root.replaceChildren();
    const players = getPlayers();
    const settings = getSettings();

    const playerRows = players.length === 0
      ? [el('li', { class: 'empty' }, 'Ingen spillere endnu. Tilføj jer selv 👇')]
      : players.map(p => el('li', { class: 'list-row' }, [
          el('button', {
            class: 'list-main',
            on: { click: () => navTo('/player/' + p.id) },
          }, [
            el('span', { class: 'avatar' }, p.kidMode ? '🧒' : '🙂'),
            el('span', { class: 'name' }, p.name || '(uden navn)'),
            el('span', { class: 'count' }, `${p.slips.length} sedler`),
          ]),
          el('button', {
            class: 'icon-btn',
            'aria-label': 'Slet ' + p.name,
            on: { click: () => {
              if (confirm(`Slet ${p.name}?`)) {
                removePlayer(p.id);
                render();
              }
            } },
          }, '✕'),
        ]));

    const addPlayer = () => {
      const name = prompt('Spillerens navn:');
      if (!name || !name.trim()) return;
      const newP = { id: uid(), name: name.trim(), kidMode: false, slips: [] };
      upsertPlayer(newP);
      navTo('/player/' + newP.id);
    };

    const apiKeyInput = el('input', {
      type: 'text',
      placeholder: 'TMDb v3 API-nøgle',
      value: settings.tmdbApiKey || '',
      autocomplete: 'off',
      spellcheck: 'false',
    });
    apiKeyInput.addEventListener('change', () =>
      saveSettings({ ...getSettings(), tmdbApiKey: apiKeyInput.value.trim() }));

    const timerInput = el('input', {
      type: 'number',
      min: '15',
      max: '300',
      step: '5',
      value: String(settings.timerSeconds),
    });
    timerInput.addEventListener('change', () =>
      saveSettings({ ...getSettings(), timerSeconds: Number(timerInput.value) || 60 }));

    const hideTitleCb = el('input', { type: 'checkbox' });
    hideTitleCb.checked = !!settings.hideTitleForKids;
    hideTitleCb.addEventListener('change', () =>
      saveSettings({ ...getSettings(), hideTitleForKids: hideTitleCb.checked }));

    const enoughPlayers = players.filter(p => p.slips.length > 0).length >= 2;

    root.appendChild(el('div', { class: 'view home' }, [
      el('header', { class: 'hero' }, [
        el('div', { class: 'bowl-emoji' }, '🥣'),
        el('h1', {}, 'Margretheskål'),
        el('p', { class: 'tagline' }, 'Træk en seddel. Forklar uden at sige titlen.'),
      ]),
      el('section', { class: 'card' }, [
        el('h2', {}, 'Spillere'),
        el('ul', { class: 'list' }, playerRows),
        el('button', { class: 'btn primary add-player', on: { click: addPlayer } }, '+ Tilføj spiller'),
      ]),
      el('section', { class: 'actions' }, [
        el('button', {
          class: 'btn big accent',
          disabled: !enoughPlayers,
          on: { click: () => navTo('/setup') },
        }, enoughPlayers ? 'Ny runde 🥣' : 'Min. 2 spillere med sedler'),
      ]),
      el('details', { class: 'settings', open: !settings.tmdbApiKey || undefined }, [
        el('summary', {}, '⚙︎ Indstillinger'),
        el('label', { class: 'field' }, [
          el('span', {}, 'TMDb API-nøgle'),
          apiKeyInput,
          el('p', { class: 'hint' }, [
            'Gratis på ',
            el('a', { href: 'https://www.themoviedb.org/settings/api', target: '_blank', rel: 'noopener' }, 'themoviedb.org'),
            ' (vælg "API Read Access" v3 auth).',
          ]),
        ]),
        el('label', { class: 'field' }, [
          el('span', {}, 'Tid pr. tur (sek.)'),
          timerInput,
        ]),
        el('label', { class: 'check' }, [
          hideTitleCb,
          el('span', {}, 'Skjul titel for kid mode-spillere'),
        ]),
      ]),
    ]));
  };

  render();
};
