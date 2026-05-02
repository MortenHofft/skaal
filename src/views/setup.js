import { el, navTo, shuffle } from '../dom.js';
import { getPlayers, getSettings, saveGame } from '../state.js';

export const renderSetup = (root) => {
  const players = getPlayers();
  const settings = getSettings();
  const selected = new Set(players.filter(p => p.slips.length > 0).map(p => p.id));
  let timerSeconds = settings.timerSeconds;
  let startBtn;

  const totalSelectedSlips = () =>
    [...selected].reduce((sum, id) => sum + (players.find(p => p.id === id)?.slips.length || 0), 0);

  const updateStart = () => {
    if (!startBtn) return;
    const tot = totalSelectedSlips();
    const ok = selected.size >= 2 && tot >= 4;
    startBtn.disabled = !ok;
    startBtn.textContent = ok
      ? `Start runde (${tot} sedler)`
      : selected.size < 2 ? 'Mindst 2 spillere' : 'Mindst 4 sedler i alt';
  };

  const start = () => {
    const order = shuffle([...selected]);
    const slips = [];
    for (const pid of order) {
      const p = players.find(x => x.id === pid);
      for (const s of p.slips) slips.push({ playerId: pid, slipId: s.id, ...s });
    }
    saveGame({
      playerOrder: order,
      currentPlayerIdx: 0,
      remaining: shuffle(slips),
      drawn: [],
      skipped: [],
      scores: Object.fromEntries(order.map(id => [id, 0])),
      timerSeconds,
      phase: 'ready',
    });
    navTo('/play');
  };

  const playerList = el('ul', { class: 'list' },
    players.map(p => {
      const cb = el('input', { type: 'checkbox' });
      cb.checked = selected.has(p.id);
      cb.disabled = p.slips.length === 0;
      cb.addEventListener('change', () => {
        if (cb.checked) selected.add(p.id);
        else selected.delete(p.id);
        updateStart();
      });
      return el('li', { class: 'list-row' }, [
        el('label', { class: 'list-main check-label' + (cb.disabled ? ' disabled' : '') }, [
          cb,
          el('span', { class: 'avatar' }, p.kidMode ? '🧒' : '🙂'),
          el('span', { class: 'name' }, p.name),
          el('span', { class: 'count' }, p.slips.length === 0 ? 'ingen sedler' : `${p.slips.length} sedler`),
        ]),
      ]);
    })
  );

  const timerInput = el('input', { type: 'number', min: '15', max: '300', step: '5', value: String(timerSeconds) });
  timerInput.addEventListener('change', () => {
    timerSeconds = Math.max(15, Math.min(300, Number(timerInput.value) || 60));
    timerInput.value = String(timerSeconds);
  });

  startBtn = el('button', { class: 'btn big accent', on: { click: start } });
  updateStart();

  root.appendChild(el('div', { class: 'view setup' }, [
    el('header', { class: 'topbar' }, [
      el('button', { class: 'icon-btn', on: { click: () => navTo('/') } }, '←'),
      el('h1', {}, 'Ny runde'),
    ]),
    el('section', { class: 'card' }, [
      el('h2', {}, 'Hvem spiller med?'),
      playerList,
    ]),
    el('section', { class: 'card' }, [
      el('label', { class: 'field' }, [el('span', {}, 'Tid pr. tur (sek.)'), timerInput]),
    ]),
    el('section', { class: 'actions' }, [startBtn]),
  ]));
};
