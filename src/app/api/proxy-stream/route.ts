import { NextRequest, NextResponse } from 'next/server';
import { Agent, fetch } from 'undici';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Enhanced ad filtering for HLS manifests - more aggressive filtering with filler replacement
function filterHLSManifest(manifestText: string, request: NextRequest): string {
  const adIndicators = [
    // Standard ad tags
    '#EXT-X-DATERANGE:CLASS="ad"',
    '#EXT-X-DATERANGE:ID="ad"',
    '#EXT-X-DATERANGE:CLASS="com.apple.ads"',
    '#EXT-X-SCTE35',
    '#EXT-X-CUE',
    '#EXT-X-CUE-IN',
    '#EXT-X-CUE-OUT',
    '#EXT-X-CUE-OUT-CONT',

    // Common ad keywords in URLs and metadata
    'ad',
    'ads',
    'advert',
    'advertisement',
    'preroll',
    'midroll',
    'postroll',
    'sponsor',
    'sponsored',
    'commercial',
    'promo',
    'promotion',
    'tracking',
    'analytics',
    'impression',
    'pixel',
    'beacon',
    'vast',
    'vpaid',
    'ima',
    'doubleclick',
    'googlesyndication',
    'amazon-adsystem',
    'pubmatic',
    'appnexus',
    'openx',
    'thetradedesk',
    'media.net',
    'criteo',
    'outbrain',
    'taboola',
    'yieldmo',
    'spotx',
    'freewheel',
    'brightcove',
    'jwplayer-ads',
    'videojs-ads',

    // Mobile-specific ad patterns
    'mobile-ad',
    'app-ad',
    'interstitial',
    'rewarded',
    'native-ad',
    'banner-ad',
    'popup-ad',
    'overlay-ad',

    // Common ad server domains in URLs
    'adsystem.',
    'adserver.',
    'doubleclick.net',
    'googlesyndication.com',
    'amazon-adsystem.com',
    'pubmatic.com',
    'appnexus.com',
    'openx.com',
    'thetradedesk.com',
    'media.net',
    'criteo.com',
    'outbrain.com',
    'taboola.com',
    'yieldmo.com',
    'spotx.tv',
    'freewheel.tv',
    'brightcove.com',
    'jwplayer.com/ads',
    'videojs.com/ads',

    // Additional patterns for vidsrc and similar sites
    'vast.',
    'ima.',
    'googletagmanager',
    'google-analytics',
    'facebook.com/tr',
    'twitter.com/i/ads',
    'linkedin.com/li_ads',
    'pinterest.com/ct',
    'tiktok.com/i/ads',
    'snapchat.com/ads',
    'instagram.com/ads',
    'youtube.com/api/stats',
    'vimeo.com/api/stats',
    'dailymotion.com/api/stats',

    // Vidsrc specific patterns
    'vidsrc.xyz/ads',
    'vidsrc.to/ads',
    'vidsrc.me/ads',
    'vidsrc.pro/ads',
    'embed.su/ads',
    'player.vidsrc.me/ads',
    'cdn.vidsrc.me/ads',
    'cdn.vidsrc.pro/ads',
  ];

  const lines = manifestText.split('\n');
  const filteredLines: string[] = [];
  let skipSegment = false;
  let segmentDuration = 0;
  let inAdBlock = false;
  const fillerUrl = `${request.nextUrl.origin}/api/proxy-stream/filler`;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if this line contains ad indicators
    let isAdLine = false;
    for (const indicator of adIndicators) {
      if (lowerLine.includes(indicator)) {
        isAdLine = true;
        break;
      }
    }

    // Handle EXTINF duration lines (segment metadata)
    if (line.startsWith('#EXTINF:')) {
      const durationMatch = line.match(/#EXTINF:([0-9.]+)/);
      if (durationMatch) {
        segmentDuration = parseFloat(durationMatch[1]);
      }
    }

    // Skip ad-related lines and very short segments (likely ads)
    if (isAdLine || (segmentDuration > 0 && segmentDuration < 5 && lowerLine.includes('.ts'))) {
      skipSegment = true;
      inAdBlock = true;
      continue;
    }

    // If we're in an ad block, replace segment URLs with filler
    if (inAdBlock && !line.startsWith('#') && line.trim()) {
      // Check if this looks like a real content segment
      if (line.includes('.ts') && segmentDuration > 10) {
        inAdBlock = false;
        filteredLines.push(line);
      } else {
        // Replace ad segment with filler
        filteredLines.push(fillerUrl);
        continue;
      }
    }

    // If we're not skipping and it's a segment URL, add it
    if (!skipSegment) {
      filteredLines.push(line);
    }

    // Reset skip flag after processing the segment
    if (!line.startsWith('#') && line.trim()) {
      skipSegment = false;
      segmentDuration = 0;
    }
  }

  return filteredLines.join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function extractVideoSources(url: string): Promise<string[]> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Use headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // Speed up loading
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      timeout: 30000 // Reduce timeout
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait a bit for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract video sources
    const sources = await page.evaluate(() => {
      const videoSources: string[] = [];

      // Get <video> elements
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        if (video.src) videoSources.push(video.src);
        const sources = video.querySelectorAll('source');
        sources.forEach(source => {
          if (source.src) videoSources.push(source.src);
        });
      });

      // Get iframes that might contain video players
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (iframe.src && (iframe.src.includes('embed') || iframe.src.includes('player'))) {
          videoSources.push(iframe.src);
        }
      });

      // Look for common video player containers
      const players = document.querySelectorAll('[data-video], [data-src], .video-player, .player');
      players.forEach(player => {
        const dataSrc = player.getAttribute('data-src') || player.getAttribute('data-video');
        if (dataSrc) videoSources.push(dataSrc);
      });

      return videoSources;
    });

    return sources;
  } catch (error) {
    console.error('Puppeteer extraction error:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Function to inject ad-blocking scripts into HTML
function injectAdBlockingScripts(html: string, baseUrl: string): string {
  const adBlockScript = `
    <script>
      // Basic ad blocking script
      const baseUrl = '${baseUrl}';
      (function() {
        // Block common ad selectors
        const adSelectors = [
          '[id*="ad"]', '[class*="ad"]', '[id*="banner"]', '[class*="banner"]',
          '[id*="sponsor"]', '[class*="sponsor"]', '[id*="promo"]', '[class*="promo"]',
          'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
          'iframe[src*="amazon-adsystem"]', 'iframe[src*="pubmatic"]',
          'iframe[src*="appnexus"]', 'iframe[src*="openx"]', 'iframe[src*="criteo"]',
          'iframe[src*="outbrain"]', 'iframe[src*="taboola"]', 'iframe[src*="yieldmo"]',
          'iframe[src*="spotx"]', 'iframe[src*="freewheel"]', 'iframe[src*="brightcove"]',
          'iframe[src*="jwplayer"]', 'iframe[src*="videojs"]', 'iframe[src*="ima"]',
          'iframe[src*="vast"]', 'iframe[src*="vpaid"]'
        ];

        function removeAds() {
          adSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el && el.parentNode) {
                el.parentNode.removeChild(el);
              }
            });
          });
        }

        // Run immediately and after DOM changes
        removeAds();
        const observer = new MutationObserver(removeAds);
        observer.observe(document.body, { childList: true, subtree: true });

        // Override document.createElement to rewrite URLs in dynamically created elements
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(this, tagName);
          if (tagName === 'script' || tagName === 'link' || tagName === 'img' || tagName === 'iframe') {
            // Intercept property sets
            Object.defineProperty(element, 'src', {
              get: function() { return this.getAttribute('src'); },
              set: function(value) {
                if (value && typeof value === 'string' && value.startsWith('/')) {
                  value = '/api/proxy-stream?url=' + encodeURIComponent('https://vidsrc.xyz' + value);
                }
                this.setAttribute('src', value);
              }
            });
            Object.defineProperty(element, 'href', {
              get: function() { return this.getAttribute('href'); },
              set: function(value) {
                if (value && typeof value === 'string' && value.startsWith('/')) {
                  value = '/api/proxy-stream?url=' + encodeURIComponent('https://vidsrc.xyz' + value);
                }
                this.setAttribute('href', value);
              }
            });
          }
          return element;
        };

        // Helper function to check if URL should be proxied
        function shouldProxyUrl(url) {
          if (typeof url !== 'string') return false;

          // Block ad networks
          if (
            url.includes('doubleclick.net') ||
            url.includes('googlesyndication.com') ||
            url.includes('amazon-adsystem.com') ||
            url.includes('pubmatic.com') ||
            url.includes('appnexus.com') ||
            url.includes('openx.com') ||
            url.includes('criteo.com') ||
            url.includes('outbrain.com') ||
            url.includes('taboola.com') ||
            url.includes('yieldmo.com') ||
            url.includes('spotx.tv') ||
            url.includes('freewheel.tv') ||
            url.includes('brightcove.com') ||
            url.includes('jwplayer.com') ||
            url.includes('videojs.com') ||
            url.includes('ima.') ||
            url.includes('vast.') ||
            url.includes('vpaid.')
          ) {
            return false; // Block ads
          }

          // Proxy allowed domains
          const allowedDomains = [
            'vidsrc.xyz', 'vidsrc.to', 'vidsrc.me', 'vidsrc.pro', 'vidsrc-embed.ru',
            'embed.su', 'cloudnestra.com', 'cloudnestra.net', 'player.cloudnestra.com', 'cdn.cloudnestra.com',
            'akamaihd.net', 'fastly.net', 'cloudflare.com', 'amazonaws.com', 'googleusercontent.com',
            'googlevideo.com', 'youtube.com', 'vimeo.com', 'dailymotion.com', 'twitch.tv'
          ];

          try {
            const urlObj = new URL(url.startsWith('//') ? 'https:' + url : url);
            return allowedDomains.some(domain =>
              urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
            );
          } catch {
            return false;
          }
        }

        // Override XMLHttpRequest to rewrite URLs
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          if (typeof url === 'string') {
            if (url.startsWith('/') && !url.startsWith('//')) {
              // Relative URL - convert to absolute then check
              if (!url.match(/^\/(api\/|static\/|_next\/|favicon\.|manifest\.|robots\.|sitemap\.)/) &&
                  !url.includes('google') && !url.includes('facebook') && !url.includes('twitter') &&
                  !url.includes('analytics') && !url.includes('tracking')) {
                url = '/api/proxy-stream?url=' + encodeURIComponent('${baseUrl}' + url);
              }
            } else if (shouldProxyUrl(url)) {
              // Absolute URL to allowed domain - proxy it
              url = '/api/proxy-stream?url=' + encodeURIComponent(url);
            }
          }
          return originalOpen.call(this, method, url, ...args);
        };

        // Block ad network requests and proxy allowed URLs
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          let url = args[0];
          if (typeof url === 'string') {
            if (url.startsWith('/') && !url.startsWith('//')) {
              // Relative URL
              if (!url.match(/^\/(api\/|static\/|_next\/|favicon\.|manifest\.|robots\.|sitemap\.)/) &&
                  !url.includes('google') && !url.includes('facebook') && !url.includes('twitter') &&
                  !url.includes('analytics') && !url.includes('tracking')) {
                url = '/api/proxy-stream?url=' + encodeURIComponent('${baseUrl}' + url);
              }
            } else if (shouldProxyUrl(url)) {
              // Absolute URL to allowed domain - proxy it
              url = '/api/proxy-stream?url=' + encodeURIComponent(url);
            } else if (
              // Block ad networks
              url.includes('doubleclick.net') ||
              url.includes('googlesyndication.com') ||
              url.includes('amazon-adsystem.com') ||
              url.includes('pubmatic.com') ||
              url.includes('appnexus.com') ||
              url.includes('openx.com') ||
              url.includes('criteo.com') ||
              url.includes('outbrain.com') ||
              url.includes('taboola.com') ||
              url.includes('yieldmo.com') ||
              url.includes('spotx.tv') ||
              url.includes('freewheel.tv') ||
              url.includes('brightcove.com') ||
              url.includes('jwplayer.com') ||
              url.includes('videojs.com') ||
              url.includes('ima.') ||
              url.includes('vast.') ||
              url.includes('vpaid.')
            ) {
              return Promise.reject(new Error('Ad request blocked'));
            }
          }
          return originalFetch.apply(this, args);
        };
      })();
    </script>
  `;

  // Inject the script before the closing </head> tag, or at the beginning of <body> if no head
  if (html.includes('</head>')) {
    return html.replace('</head>', adBlockScript + '</head>');
  } else if (html.includes('<body>')) {
    return html.replace('<body>', '<body>' + adBlockScript);
  } else {
    return adBlockScript + html;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function rewriteHTMLUrls(html: string, baseUrl: string, proxyUrl: string): string {
  const urlRegex = /(?:src|href|data-src)=["']([^"']+)["']/gi;
  const cssUrlRegex = /url\(["']?([^"'\)]+)["']?\)/gi;

  return html
    .replace(urlRegex, (match, url) => {
      // Skip data URLs, anchors, and javascript
      if (url.startsWith('data:') || url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:')) {
        return match;
      }

      if (url.startsWith('http') || url.startsWith('//')) {
        // Absolute URL - proxy it
        const proxiedUrl = `${proxyUrl}?url=${encodeURIComponent(url)}`;
        return match.replace(url, proxiedUrl);
      } else if (url.startsWith('/')) {
        // Root-relative URL - convert to absolute then proxy
        const absoluteUrl = new URL(url, baseUrl).href;
        const proxiedUrl = `${proxyUrl}?url=${encodeURIComponent(absoluteUrl)}`;
        return match.replace(url, proxiedUrl);
      } else {
        // Relative URL - convert to absolute then proxy
        const absoluteUrl = new URL(url, baseUrl).href;
        const proxiedUrl = `${proxyUrl}?url=${encodeURIComponent(absoluteUrl)}`;
        return match.replace(url, proxiedUrl);
      }
    })
    .replace(cssUrlRegex, (match, url) => {
      // Skip data URLs
      if (url.startsWith('data:')) {
        return match;
      }

      if (url.startsWith('http') || url.startsWith('//')) {
        // Absolute URL - proxy it
        const proxiedUrl = `${proxyUrl}?url=${encodeURIComponent(url)}`;
        return match.replace(url, proxiedUrl);
      } else if (url.startsWith('/')) {
        // Root-relative URL - convert to absolute then proxy
        const absoluteUrl = new URL(url, baseUrl).href;
        const proxiedUrl = `${proxyUrl}?url=${encodeURIComponent(absoluteUrl)}`;
        return match.replace(url, proxiedUrl);
      } else {
        // Relative URL - convert to absolute then proxy
        const absoluteUrl = new URL(url, baseUrl).href;
        const proxiedUrl = `${proxyUrl}?url=${encodeURIComponent(absoluteUrl)}`;
        return match.replace(url, proxiedUrl);
      }
    });
}

export const GET = async (request: NextRequest) => {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL to prevent abuse
  try {
    // Handle protocol-relative URLs (//...)
    const fullUrl = url.startsWith('//') ? 'https:' + url : url;
    new URL(fullUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Only allow streaming URLs from trusted sources
  const allowedDomains = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'vidsrc.xyz',
    'vidsrc.to',
    'vidsrc.me',
    'vidsrc.pro',
    'vidsrc-embed.ru',
    'embed.su',
    'player.vidsrc.me',
    'player.vidsrc.pro',
    'cdn.vidsrc.me',
    'cdn.vidsrc.pro',
    // Video streaming domains
    'cloudnestra.com',
    'cloudnestra.net',
    'player.cloudnestra.com',
    'cdn.cloudnestra.com',
    // Common streaming and CDN domains
    'akamaihd.net',
    'fastly.net',
    'cloudflare.com',
    'amazonaws.com',
    'googleusercontent.com',
    'googlevideo.com',
    'youtube.com',
    'vimeo.com',
    'dailymotion.com',
    'twitch.tv',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'ajax.googleapis.com',
    'code.jquery.com',
    'stackpath.bootstrapcdn.com',
    'maxcdn.bootstrapcdn.com',
    'unpkg.com',
    'jsdelivr.net',
    'raw.githubusercontent.com',
    'githubusercontent.com',
  ];

  // Handle protocol-relative URLs for domain checking
  const fullUrl = url.startsWith('//') ? 'https:' + url : url;
  const urlObj = new URL(fullUrl);
  const isAllowed = allowedDomains.some(domain =>
    urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
  }

  try {
    // Handle redirects manually to follow them properly
    let currentUrl = fullUrl;
    let response: Response | undefined;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

        response = await fetch(currentUrl, {
          signal: controller.signal,
          redirect: 'manual', // Handle redirects manually
          dispatcher: new Agent({ connect: { timeout: 60000 } }),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        }) as unknown as Response;

        clearTimeout(timeoutId);

        // Handle redirects
        if (response!.status >= 300 && response!.status < 400) {
          const location = response!.headers.get('location');
          if (location) {
            // Check if redirect is to an allowed domain
            const redirectUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
            const redirectUrlObj = new URL(redirectUrl);
            const isRedirectAllowed = allowedDomains.some(domain =>
              redirectUrlObj.hostname === domain || redirectUrlObj.hostname.endsWith('.' + domain)
            );

            if (isRedirectAllowed) {
              currentUrl = redirectUrl;
              continue; // Retry with new URL
            } else {
              return NextResponse.json({ error: 'Redirect to unauthorized domain' }, { status: 403 });
            }
          }
        }

        break; // Success, exit retry loop

      } catch (err) {
        lastError = err as Error;
        if (attempt < 3) {
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        // Last attempt failed, throw the error
        throw err;
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to fetch after retries');
    }

    // Type assertion since we've checked response is not undefined
    const safeResponse = response as Response;
    const contentType = safeResponse.headers.get('content-type') || '';

    // If it's a manifest, filter ads
    if (
      contentType.includes('application/vnd.apple.mpegurl') ||
      url.endsWith('.m3u8')
    ) {
      const manifestText = await safeResponse.text();
      const filteredManifest = filterHLSManifest(manifestText, request);
      return new NextResponse(filteredManifest, {
        status: 200,
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl' },
      });
    }

    // If it's HTML content, extract video sources with Puppeteer and inject ad-blocking
    if (contentType.includes('text/html')) {
      let text = await safeResponse.text();

      // Rewrite URLs in src and href attributes
      const baseUrl = new URL(currentUrl).origin;
      text = text.replace(
        /(src|href)="([^"]*)"/g,
        (match, attr, url) => {
          // Skip data URLs, anchors, javascript, and mailto
          if (url.startsWith('data:') || url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:')) {
            return match;
          }

          // Skip certain URLs that cause 404 errors
          if (url === 'favicon.ico' ||
              url.startsWith('api/') || url.startsWith('static/')) {
            return match; // Don't rewrite
          }

          let proxiedUrl: string;
          if (url.startsWith('http') || url.startsWith('//')) {
            // Absolute URL - proxy it
            proxiedUrl = `${request.nextUrl.origin}/api/proxy-stream?url=${encodeURIComponent(url)}`;
          } else if (url.startsWith('/')) {
            // Root-relative URL - convert to absolute then proxy
            const absoluteUrl = baseUrl + url;
            proxiedUrl = `${request.nextUrl.origin}/api/proxy-stream?url=${encodeURIComponent(absoluteUrl)}`;
          } else {
            // Relative URL - convert to absolute then proxy
            const absoluteUrl = new URL(url, currentUrl).href;
            proxiedUrl = `${request.nextUrl.origin}/api/proxy-stream?url=${encodeURIComponent(absoluteUrl)}`;
          }

          return `${attr}="${proxiedUrl}"`;
        }
      );

      // Only inject ad-blocking scripts for non-vidsrc domains to avoid interfering with player functionality
      if (!urlObj.hostname.includes('vidsrc')) {
        text = injectAdBlockingScripts(text, baseUrl);
      }

      return new NextResponse(text, {
        status: safeResponse.status,
        headers: {
          'Content-Type': contentType,
        },
      });
    }

    // Otherwise (TS segments, keys, JS, CSS, images, etc.) → just proxy raw
    const body = await safeResponse.arrayBuffer();
    return new NextResponse(body, {
      status: safeResponse.status,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    if (err instanceof Error && (err as Error & { cause?: { code?: string } }).cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json({ error: 'Connection timeout' }, { status: 408 });
    }
    return NextResponse.json({ error: 'Failed to fetch stream' }, { status: 500 });
  }
}