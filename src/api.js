const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/';

export const searchMulti = async (apiKey, query, { signal, lang = 'da-DK' } = {}) => {
  if (!apiKey || !query.trim()) return [];
  const url = new URL(BASE + '/search/multi');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('query', query);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', lang);
  const r = await fetch(url, { signal });
  if (!r.ok) {
    const msg = r.status === 401 ? 'Ugyldig TMDb-nøgle' : 'TMDb-fejl: ' + r.status;
    throw new Error(msg);
  }
  const data = await r.json();
  return (data.results || [])
    .filter(x => (x.media_type === 'movie' || x.media_type === 'tv') && x.poster_path)
    .map(x => ({
      tmdbId: x.id,
      mediaType: x.media_type,
      title: x.media_type === 'movie' ? x.title : x.name,
      year: (x.release_date || x.first_air_date || '').slice(0, 4),
      posterPath: x.poster_path,
    }));
};

export const posterUrl = (path, size = 'w500') =>
  path ? `${IMG}${size}${path}` : '';
