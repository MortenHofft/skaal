import { renderHome } from './views/home.js';
import { renderPlayer } from './views/player.js';
import { renderSetup } from './views/setup.js';
import { renderPlay } from './views/play.js';
import { renderResults } from './views/results.js';

const app = document.getElementById('app');

const route = () => {
  const hash = (location.hash || '#/').slice(1);
  app.replaceChildren();
  if (hash.startsWith('/player/')) return renderPlayer(app, hash.slice('/player/'.length));
  if (hash === '/setup') return renderSetup(app);
  if (hash === '/play') return renderPlay(app);
  if (hash === '/results') return renderResults(app);
  return renderHome(app);
};

window.addEventListener('hashchange', route);
route();
