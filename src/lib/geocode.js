// Geocodificação de endereços via Nominatim (OpenStreetMap), mesma fonte dos tiles do mapa.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Centro de São Paulo — usado apenas quando não há endereço geocodificável.
export const FALLBACK_LOCATION = [-23.5505, -46.6333];

const cache = new Map();

/**
 * Converte um endereço em [lat, lng]. Retorna null se não for possível localizar,
 * para que o chamador decida entre usar o fallback ou não gravar coordenada.
 */
export async function geocodeEndereco(endereco) {
  const query = (endereco || '').trim();
  if (!query) return null;
  if (cache.has(query)) return cache.get(query);

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'br',
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const [hit] = await res.json();
    if (!hit) return null;

    const location = [parseFloat(hit.lat), parseFloat(hit.lon)];
    if (Number.isNaN(location[0]) || Number.isNaN(location[1])) return null;

    cache.set(query, location);
    return location;
  } catch {
    return null;
  }
}
