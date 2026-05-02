const K = {
  players: 'magreth.players',
  settings: 'magreth.settings',
  game: 'magreth.game',
};

const read = (k, fb) => {
  try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); }
  catch { return fb; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const uid = () => Math.random().toString(36).slice(2, 10);

export const getPlayers = () => read(K.players, []);
export const savePlayers = (p) => write(K.players, p);
export const getPlayer = (id) => getPlayers().find(p => p.id === id);
export const upsertPlayer = (player) => {
  const all = getPlayers();
  const i = all.findIndex(p => p.id === player.id);
  if (i >= 0) all[i] = player; else all.push(player);
  savePlayers(all);
};
export const removePlayer = (id) => savePlayers(getPlayers().filter(p => p.id !== id));

export const getSettings = () => read(K.settings, {
  tmdbApiKey: '',
  timerSeconds: 60,
  hideTitleForKids: true,
});
export const saveSettings = (s) => write(K.settings, s);

export const getGame = () => read(K.game, null);
export const saveGame = (g) => write(K.game, g);
export const clearGame = () => localStorage.removeItem(K.game);
