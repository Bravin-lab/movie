const JELLYFIN_BASE_URL = process.env.NEXT_PUBLIC_JELLYFIN_BASE_URL || '';
const JELLYFIN_API_KEY = process.env.NEXT_PUBLIC_JELLYFIN_API_KEY || '';

interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  Path?: string;
  MediaSources?: {
    Id: string;
    Path: string;
    Protocol: string;
    Container: string;
    DirectStreamUrl?: string;
  }[];
}

interface JellyfinSearchResult {
  Items: JellyfinItem[];
  TotalRecordCount: number;
}

async function jellyfinRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!JELLYFIN_BASE_URL || !JELLYFIN_API_KEY) {
    throw new Error('Jellyfin configuration missing. Please set NEXT_PUBLIC_JELLYFIN_BASE_URL and NEXT_PUBLIC_JELLYFIN_API_KEY');
  }

  const url = new URL(JELLYFIN_BASE_URL + endpoint);
  url.searchParams.append('api_key', JELLYFIN_API_KEY);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Jellyfin API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function searchJellyfinItems(query: string, type: 'Movie' | 'Series' = 'Movie'): Promise<JellyfinItem[]> {
  const result: JellyfinSearchResult = await jellyfinRequest('/Items', {
    searchTerm: query,
    IncludeItemTypes: type,
    Recursive: 'true',
    Fields: 'MediaSources,Path',
    Limit: '10'
  });
  return result.Items;
}

export async function getJellyfinItem(itemId: string): Promise<JellyfinItem> {
  return jellyfinRequest(`/Items/${itemId}`, {
    Fields: 'MediaSources,Path'
  });
}

export async function getJellyfinStreamUrl(itemId: string, mediaSourceId?: string): Promise<string> {
  const item = await getJellyfinItem(itemId);
  if (!item.MediaSources || item.MediaSources.length === 0) {
    throw new Error('No media sources available');
  }

  const mediaSource = mediaSourceId
    ? item.MediaSources.find(ms => ms.Id === mediaSourceId)
    : item.MediaSources[0];

  if (!mediaSource) {
    throw new Error('Media source not found');
  }

  // Jellyfin provides direct stream URLs
  if (mediaSource.DirectStreamUrl) {
    return mediaSource.DirectStreamUrl;
  }

  // Fallback to constructing stream URL
  const streamUrl = `${JELLYFIN_BASE_URL}/Videos/${itemId}/stream?api_key=${JELLYFIN_API_KEY}&Static=true`;
  if (mediaSourceId) {
    return `${streamUrl}&MediaSourceId=${mediaSourceId}`;
  }
  return streamUrl;
}

export async function findJellyfinItemByTMDB(tmdbId: number, type: 'Movie' | 'Series' = 'Movie'): Promise<JellyfinItem | null> {
  // Search by TMDB ID if available, otherwise by title
  // This is a simplified implementation - in practice, you might need to match by title or external ID
  const searchTerm = tmdbId.toString();
  const items = await searchJellyfinItems(searchTerm, type);

  // Return first match or null
  return items.length > 0 ? items[0] : null;
}
