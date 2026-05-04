import { el, navTo } from '../dom.js';
import { getPlayer, upsertPlayer, getSettings, uid } from '../state.js';
import { searchMulti, posterUrl } from '../api.js';

export const renderPlayer = (root, id) => {
  let player = getPlayer(id);
  if (!player) { navTo('/'); return; }

  let searchResults = [];
  let searching = false;
  let searchError = '';
  let lastQuery = '';
  let abortCtrl = null;
  let resultsBox;

  const save = (patch) => {
    player = { ...player, ...patch };
    upsertPlayer(player);
  };

  const addSlip = (item) => {
    if (player.slips.some(s => s.tmdbId === item.tmdbId && s.mediaType === item.mediaType)) return;
    save({ slips: [...player.slips, { id: uid(), ...item }] });
    render();
  };

  const removeSlip = (slipId) => {
    save({ slips: player.slips.filter(s => s.id !== slipId) });
    render();
  };

  const onSearch = async (query) => {
    lastQuery = query;
    if (abortCtrl) abortCtrl.abort();
    const settings = getSettings();
    if (!query.trim()) {
      searchResults = [];
      searching = false;
      searchError = '';
      paintResults();
      return;
    }
    if (!settings.tmdbApiKey) {
      searching = false;
      searchError = 'Tilføj TMDb-nøgle på forsiden under Indstillinger.';
      paintResults();
      return;
    }
    abortCtrl = new AbortController();
    searching = true;
    searchError = '';
    paintResults();
    try {
      const res = await searchMulti(settings.tmdbApiKey, query, { signal: abortCtrl.signal });
      if (lastQuery !== query) return;
      searchResults = res;
      searching = false;
      paintResults();
    } catch (e) {
      if (e.name === 'AbortError') return;
      searching = false;
      searchError = e.message || 'Søgefejl';
      searchResults = [];
      paintResults();
    }
  };

  const paintResults = () => {
    if (!resultsBox) return;
    resultsBox.replaceChildren(...buildResultNodes());
  };

  const buildResultNodes = () => {
    if (searchError) return [el('p', { class: 'hint error' }, searchError)];
    if (searching) return [el('p', { class: 'hint' }, 'Søger...')];
    if (!lastQuery.trim()) return [];
    if (searchResults.length === 0) return [el('p', { class: 'hint' }, 'Ingen resultater.')];
    return searchResults.map(r => {
      const already = player.slips.some(s => s.tmdbId === r.tmdbId && s.mediaType === r.mediaType);
      return el('button', {
        class: 'result-row' + (already ? ' added' : ''),
        disabled: already,
        on: { click: () => addSlip(r) },
      }, [
        el('img', { src: posterUrl(r.posterPath, 'w92'), alt: '', loading: 'lazy' }),
        el('div', { class: 'meta' }, [
          el('div', { class: 'title' }, r.title),
          el('div', { class: 'sub' }, [r.year, r.mediaType === 'tv' ? 'serie' : 'film'].filter(Boolean).join(' • ')),
        ]),
        el('span', { class: 'plus' }, already ? '✓' : '+'),
      ]);
    });
  };

  const render = () => {
    root.replaceChildren();

    const nameInput = el('input', { type: 'text', value: player.name, placeholder: 'Navn' });
    nameInput.addEventListener('change', () => save({ name: nameInput.value.trim() || 'Spiller' }));

    const kidToggle = el('input', { type: 'checkbox' });
    kidToggle.checked = !!player.kidMode;
    kidToggle.addEventListener('change', () => save({ kidMode: kidToggle.checked }));

    let debounce;
    const searchInput = el('input', {
      type: 'search',
      placeholder: 'Søg film eller serie...',
      autocomplete: 'off',
      spellcheck: 'false',
      value: lastQuery,
    });
    const clearBtn = el('button', {
      type: 'button',
      class: 'search-clear',
      'aria-label': 'Ryd søgning',
      on: { click: () => {
        searchInput.value = '';
        clearTimeout(debounce);
        onSearch('');
        updateClearBtn();
        searchInput.focus();
      } },
    }, '✕');
    const updateClearBtn = () => {
      clearBtn.hidden = !searchInput.value;
    };
    updateClearBtn();
    searchInput.addEventListener('input', () => {
      updateClearBtn();
      clearTimeout(debounce);
      const q = searchInput.value;
      debounce = setTimeout(() => onSearch(q), 300);
    });
    const searchWrap = el('div', { class: 'search-wrap' }, [searchInput, clearBtn]);

    resultsBox = el('div', { class: 'results' });

    const slipsView = player.slips.length === 0
      ? el('p', { class: 'hint' }, 'Ingen sedler endnu. Søg ovenfor og tap for at tilføje.')
      : el('ul', { class: 'slip-grid' },
          player.slips.map(s => el('li', { class: 'slip-card' }, [
            el('img', { src: posterUrl(s.posterPath, 'w185'), alt: '', loading: 'lazy' }),
            el('div', { class: 'slip-title' }, s.title),
            el('button', {
              class: 'slip-remove',
              'aria-label': 'Fjern',
              on: { click: () => removeSlip(s.id) },
            }, '✕'),
          ]))
        );

    root.appendChild(el('div', { class: 'view player' }, [
      el('header', { class: 'topbar' }, [
        el('button', { class: 'icon-btn', on: { click: () => navTo('/') } }, '←'),
        el('h1', {}, 'Spiller'),
      ]),
      el('section', { class: 'card' }, [
        el('label', { class: 'field' }, [el('span', {}, 'Navn'), nameInput]),
        el('label', { class: 'check' }, [
          kidToggle,
          el('span', {}, 'Kid mode (skjul titel under spillet)'),
        ]),
      ]),
      el('section', { class: 'card' }, [
        el('h2', {}, 'Find sedler'),
        searchWrap,
        resultsBox,
      ]),
      el('section', { class: 'card' }, [
        el('h2', {}, `Mine sedler (${player.slips.length})`),
        slipsView,
      ]),
    ]));

    paintResults();
  };

  render();
};
