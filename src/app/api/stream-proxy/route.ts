import { NextRequest, NextResponse } from 'next/server';

const VID_SRC_MIRRORS = ['vidsrc.me', 'vidsrc.to', 'vidsrc.xyz'];
const MIRROR_FETCH_TIMEOUT_MS = 4500;

function isAllowedMirrorHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return VID_SRC_MIRRORS.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}

function remapUrlToMirror(urlString: string, mirrorHost: string): string {
  const url = new URL(urlString);
  url.hostname = mirrorHost;
  return url.toString();
}

function buildVidsrcUrl(mirrorHost: string, type: string, tmdb: string, season?: string | null, episode?: string | null) {
  const url = new URL(`https://${mirrorHost}/embed/${type}`);
  url.searchParams.set('tmdb', tmdb);

  if (type === 'tv') {
    if (season) url.searchParams.set('season', season);
    if (episode) url.searchParams.set('episode', episode);
  }

  return url.toString();
}

async function fetchWithFallback(urlCandidates: string[]): Promise<{ response: Response; resolvedUrl: string }> {
  let lastResponse: Response | null = null;
  let lastNetworkError: unknown = null;

  for (const candidate of urlCandidates) {
    const refererHost = new URL(candidate).hostname;

    try {
      const response = await fetch(candidate, {
        signal:
          typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
            ? AbortSignal.timeout(MIRROR_FETCH_TIMEOUT_MS)
            : undefined,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: `https://${refererHost}/`,
        },
      });

      if (response.ok) {
        return { response, resolvedUrl: candidate };
      }

      lastResponse = response;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  if (lastResponse) {
    return {
      response: lastResponse,
      resolvedUrl: urlCandidates[urlCandidates.length - 1],
    };
  }

  throw lastNetworkError ?? new Error('All stream proxy mirrors failed');
}

function filterHLSManifest(manifestText: string): string {
  const adIndicators = [
    '#EXT-X-DATERANGE:CLASS="ad"',
    '#EXT-X-DATERANGE:ID="ad"',
    '#EXT-X-DATERANGE:CLASS="com.apple.ads"',
    '#EXT-X-DATERANGE:ID="preroll"',
    '#EXT-X-DATERANGE:ID="midroll"',
    '#EXT-X-DATERANGE:ID="postroll"',
    '#EXT-X-CUE',
    '#EXT-X-SCTE35',
    'ad',
    'ads',
    'advert',
    'advertisement',
    'skip',
    'preroll',
    'postroll',
    'midroll',
    'commercial',
    'promo',
    'sponsor',
    'redirect',
    'click',
    'overlay',
    'banner',
    'popup',
    'interstitial',
    'tracking',
    'analytics',
  ];

  return manifestText
    .split('\n')
    .filter((line) => !adIndicators.some((indicator) => line.toLowerCase().includes(indicator)))
    .join('\n');
}

function filterAdsFromHtml(html: string, strictMode: boolean = true): string {
  let filteredHtml = html
    .replace(/<script[^>]*>(?:(?!<\/script>).)*(adsbygoogle|doubleclick|popunder|propeller|onclickredirect|window\.open)[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*(ads|banner|popup|advert)[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<div[^>]*(ads|banner|popup|overlay|interstitial)[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/<a[^>]*href="[^"]*(ads|click|redirect|popunder)[^"]*"[^>]*>.*?<\/a>/gi, '')
    .replace(/src="[^"]*(doubleclick|adservice|propeller)[^"]*"/gi, 'src=""');

  const injectedScript = `
  <script>
  (() => {
    const blockPopup = (url) => url && /(ads|redirect|click|popunder|propeller|adservice)/i.test(url);
    const isVideoTarget = (target) => {
      const element = target?.closest?.('video, audio, [role="button"], button');
      return Boolean(element?.closest?.('video, audio')) || element?.tagName === 'VIDEO' || element?.tagName === 'AUDIO';
    };

    const _open = window.open;
    window.open = (url, ...args) => {
      if (blockPopup(url)) return null;
      return _open.call(window, url, ...args);
    };

    const _assign = window.location.assign;
    const _replace = window.location.replace;
    window.location.assign = (url) => !blockPopup(url) && _assign.call(window.location, url);
    window.location.replace = (url) => !blockPopup(url) && _replace.call(window.location, url);

    const _addEvent = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, opts) {
      if (type === 'click' || type === 'mousedown' || type === 'mouseup' || type === 'pointerdown' || type === 'pointerup' || type === 'touchstart' || type === 'touchend' || type === 'contextmenu' || type === 'auxclick' || type === 'keydown' || type === 'submit') {
        const el = this;
        const href = el.getAttribute?.('href') || '';
        if (blockPopup(href)) return;
      }
      return _addEvent.call(this, type, listener, opts);
    };

    const cleanup = () => {
      document.querySelectorAll('div, iframe').forEach((el) => {
        const r = el.getBoundingClientRect();
        const zIndex = parseInt(el.style?.zIndex || '0', 10);
        if (zIndex > 1000 && (r.width > 100 || r.height > 100)) {
          el.remove();
        }
      });
    };
    setInterval(cleanup, 1500);

    ${strictMode ? `
      let strictEnabled = true;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

      const guard = (e) => {
        if (!strictEnabled) return;
        if (isVideoTarget(e.target)) return;
        if (isTouchDevice) {
          if (!e.isTrusted || e.touches?.length > 1 || e.changedTouches?.length > 1) {
            e.stopImmediatePropagation();
            e.preventDefault();
          }
        } else {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      };

      ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'contextmenu', 'auxclick'].forEach((type) => {
        document.addEventListener(type, guard, true);
      });

      document.addEventListener('keydown', (e) => {
        if (!strictEnabled) return;
        const active = document.activeElement;
        if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      }, true);

      document.addEventListener('submit', (e) => {
        if (!strictEnabled) return;
        e.stopImmediatePropagation();
        e.preventDefault();
      }, true);

      const waitVideo = setInterval(() => {
        const v = document.querySelector('video');
        if (v) {
          v.addEventListener('play', () => {
            strictEnabled = false;
          });
          clearInterval(waitVideo);
        }
      }, 1000);
    ` : ''}
  })();
  </script>
  `;

  return filteredHtml.replace(/<\/body>/i, `${injectedScript}</body>`);
}

function extractPlayerIframeSrc(html: string): string | null {
  const match = html.match(/<iframe[^>]*id=["']player_iframe["'][^>]*src=["']([^"']+)["'][^>]*>/i);

  if (!match?.[1]) {
    return null;
  }

  try {
    return new URL(match[1], 'https://vidsrc.me').toString();
  } catch {
    return null;
  }
}

function renderPlayerOnlyHtml(playerSrc: string): string {
  const safeSrc = playerSrc.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; frame-src https:; connect-src https:; img-src https: data: blob:; media-src https: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;" />
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        background: #000;
        overflow: hidden;
      }
      iframe {
        width: 100vw;
        height: 100vh;
        border: 0;
        display: block;
      }
    </style>
  </head>
  <body>
    <iframe
      src="${safeSrc}"
      title="Video Player"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
      allowfullscreen
      referrerpolicy="no-referrer"
    ></iframe>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const directUrl = searchParams.get('url');
  const tmdb = searchParams.get('tmdb');
  const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');
  const strict = searchParams.get('strict') !== 'false';

  let targetCandidates: string[] = [];

  if (directUrl) {
    let parsedDirectUrl: URL;

    try {
      parsedDirectUrl = new URL(directUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedDirectUrl.protocol)) {
      return NextResponse.json({ error: 'Only http(s) urls are supported' }, { status: 400 });
    }

    if (!isAllowedMirrorHost(parsedDirectUrl.hostname) && parsedDirectUrl.hostname !== 'cloudnestra.com') {
      return NextResponse.json({ error: 'Only vidsrc mirror urls are allowed' }, { status: 400 });
    }

    targetCandidates = VID_SRC_MIRRORS.map((mirrorHost) => remapUrlToMirror(parsedDirectUrl.toString(), mirrorHost));
  } else {
    if (!tmdb) {
      return NextResponse.json({ error: 'tmdb parameter is required' }, { status: 400 });
    }

    targetCandidates = VID_SRC_MIRRORS.map((mirrorHost) => buildVidsrcUrl(mirrorHost, type, tmdb, season, episode));
  }

  try {
    const { response, resolvedUrl } = await fetchWithFallback(targetCandidates);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch stream content' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      let body = await response.text();
      const playerIframeSrc = extractPlayerIframeSrc(body);

      if (playerIframeSrc) {
        return new NextResponse(renderPlayerOnlyHtml(playerIframeSrc), {
          status: response.status,
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'X-Frame-Options': 'ALLOWALL',
          },
        });
      }

      const filtered = filterAdsFromHtml(body, strict);
      return new NextResponse(filtered, {
        status: response.status,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'X-Frame-Options': 'ALLOWALL',
        },
      });
    }

    if (
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      resolvedUrl.includes('.m3u8')
    ) {
      const body = await response.text();
      const filtered = filterHLSManifest(body);
      return new NextResponse(filtered, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  } catch (error) {
    console.error('Stream proxy error:', error);
    return NextResponse.json({ error: 'Stream proxy failed' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    { message: 'CORS preflight OK' },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    }
  );
}
