import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    // Fetch the original content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://vidsrc.xyz/',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    let body = await response.text();

    // If it's HTML, filter out ads
    if (contentType.includes('text/html')) {
      body = filterAdsFromHtml(body);
    }

    // If it's an HLS manifest, filter out ads
    if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegurl') || url.includes('.m3u8')) {
      body = filterHLSManifest(body);
    }

    // Return the filtered content with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('X-Frame-Options', 'ALLOWALL');

    return new NextResponse(body, {
      status: response.status,
      headers,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
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
    'pause',
    'overlay',
    'banner',
    'popup',
    'interstitial',
    'tracking',
    'analytics',
    'impression',
    'adsegment',
    'adbreak',
    'ad-marker',
    'ad_tag',
    'ad_url',
    'touch',
    'interaction',
    'useraction',
    'user_interaction',
    'cue',
    'scte',
    'break',
    'slate',
  ];

  const lines = manifestText.split('\n');
  const filteredLines = [];
  let skipSegment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();

    // Check if this line contains ad indicators
    const hasAdIndicator = adIndicators.some(indicator =>
      lowerLine.includes(indicator.toLowerCase())
    );

    if (hasAdIndicator) {
      console.log('Filtered ad line from HLS manifest:', line);
      skipSegment = true;
      continue;
    }

    // If we're in a segment that should be skipped, continue skipping until next segment
    if (skipSegment) {
      if (line.startsWith('#EXTINF') || line.startsWith('#EXT-X-ENDLIST')) {
        skipSegment = false;
      } else {
        continue;
      }
    }

    // Skip empty lines and comments that are ad-related
    if (line === '' || (line.startsWith('#') && hasAdIndicator)) {
      continue;
    }

    filteredLines.push(line);
  }

  return filteredLines.join('\n');
}

function filterAdsFromHtml(html: string): string {
  // Remove common ad-related scripts and elements
  const adPatterns = [
    // Remove ad scripts
    /<script[^>]*>(?:[^<]*(?:googletag|adsbygoogle|doubleclick|amazon-adsystem|facebook|twitter|instagram|youtube|analytics)[^<]*)*<\/script>/gi,
    // Remove ad iframes
    /<iframe[^>]*(?:ads|advertisement|banner)[^>]*>[\s\S]*?<\/iframe>/gi,
    // Remove ad divs
    /<div[^>]*(?:ad-|advertisement|banner|popup)[^>]*>[\s\S]*?<\/div>/gi,
    // Remove Google AdSense and similar
    /<ins[^>]*class="[^"]*adsbygoogle[^"]*"[^>]*>[\s\S]*?<\/ins>/gi,
    // Remove tracking pixels
    /<img[^>]*(?:tracking|pixel|beacon)[^>]*>/gi,
    // Remove ad-related CSS
    /<style[^>]*>(?:[^<]*(?:ad-|advertisement|banner)[^<]*)*<\/style>/gi,
  ];

  let filteredHtml = html;

  // Apply all ad filtering patterns
  for (const pattern of adPatterns) {
    filteredHtml = filteredHtml.replace(pattern, '');
  }

  // Additional cleanup: remove empty script/style tags
  filteredHtml = filteredHtml.replace(/<script[^>]*><\/script>/gi, '');
  filteredHtml = filteredHtml.replace(/<style[^>]*><\/style>/gi, '');

  // Remove common ad network domains from script sources
  filteredHtml = filteredHtml.replace(/src="[^"]*(?:googletag|adsystem|doubleclick|amazon-adsystem|facebook|twitter|instagram)[^"]*"/gi, 'src=""');

  // Add autoplay script and ad prevention for user interactions
  const interactionScript = `
    <script>
      (function() {
        // Prevent ads triggered by user interactions
        function preventAdTriggers() {
          // Block scroll-triggered ads
          let scrollTimeout;
          const originalScroll = window.addEventListener;
          window.addEventListener = function(type, listener, options) {
            if (type === 'scroll') {
              return; // Block scroll event listeners that might trigger ads
            }
            return originalScroll.call(this, type, listener, options);
          };

          // Block touch-triggered ads (enhanced for Android/touch devices)
          const originalTouchStart = window.addEventListener;
          window.addEventListener = function(type, listener, options) {
            if (type === 'touchstart' || type === 'touchmove' || type === 'touchend' ||
                type === 'touchcancel' || type === 'touchenter' || type === 'touchleave' ||
                type === 'gesturestart' || type === 'gesturechange' || type === 'gestureend' ||
                type === 'pinchstart' || type === 'pinchmove' || type === 'pinchend' ||
                type === 'orientationchange' || type === 'deviceorientation' ||
                type === 'devicemotion' || type === 'resize' || type === 'orientationchange') {
              return; // Block all touch and mobile interaction event listeners that might trigger ads
            }
            return originalTouchStart.call(this, type, listener, options);
          };

          // Override setTimeout to prevent ad timers
          const originalSetTimeout = window.setTimeout;
          window.setTimeout = function(callback, delay) {
            // Block timeouts that might be used for ad loading
            if (delay && delay < 100) {
              return; // Block very short timeouts that might trigger ads
            }
            return originalSetTimeout.call(this, callback, delay);
          };

          // Block dynamic script loading that might load ads
          const originalCreateElement = document.createElement;
          document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            if (tagName.toLowerCase() === 'script') {
              // Monitor script creation
              const originalSrc = element.src;
              Object.defineProperty(element, 'src', {
                set: function(value) {
                  if (value && (value.includes('ads') || value.includes('analytics') || value.includes('tracking'))) {
                    console.log('Blocked ad script:', value);
                    return; // Don't set the src
                  }
                  element.setAttribute('src', value);
                }
              });
            }
            return element;
          };

          // Prevent click-under and click-redirect ads (enhanced for mobile)
          function preventClickAds() {
            // Override addEventListener to block click handlers that might redirect or show ads
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
              if (type === 'click' || type === 'mousedown' || type === 'mouseup' ||
                  type === 'touchstart' || type === 'touchend' || type === 'touchcancel' ||
                  type === 'gesturestart' || type === 'gestureend') {
                // Check if this element might be an ad
                const element = this;
                if (element && typeof element === 'object' && 'tagName' in element) {
                  const tagName = element.tagName.toLowerCase();
                  const className = element.className || '';
                  const id = element.id || '';
                  const href = element.href || '';

                  // Block clicks on suspicious elements (enhanced for mobile)
                  if (
                    tagName === 'a' && (href.includes('ads') || href.includes('redirect') || href.includes('click') || href.includes('mobile')) ||
                    className.includes('ad') || className.includes('banner') || className.includes('popup') ||
                    className.includes('interstitial') || className.includes('overlay') || className.includes('modal') ||
                    id.includes('ad') || id.includes('banner') || id.includes('mobile') ||
                    element.style && (element.style.position === 'fixed' || element.style.position === 'absolute') ||
                    element.hasAttribute('ontouchstart') || element.hasAttribute('ongesturestart')
                  ) {
                    console.log('Blocked click on suspicious element:', element);
                    return; // Don't add the event listener
                  }
                }
              }
              return originalAddEventListener.call(this, type, listener, options);
            };

            // Override click method to prevent programmatic clicks on ad elements
            const originalClick = HTMLElement.prototype.click;
            HTMLElement.prototype.click = function() {
              const element = this;
              const tagName = element.tagName.toLowerCase();
              const className = element.className || '';
              const id = element.id || '';
              const href = element.href || '';

              if (
                tagName === 'a' && (href.includes('ads') || href.includes('redirect') || href.includes('click') || href.includes('mobile')) ||
                className.includes('ad') || className.includes('banner') || className.includes('popup') ||
                className.includes('interstitial') || className.includes('overlay') || className.includes('modal') ||
                id.includes('ad') || id.includes('banner') || id.includes('mobile') ||
                element.style && (element.style.position === 'fixed' || element.style.position === 'absolute') ||
                element.hasAttribute('ontouchstart') || element.hasAttribute('ongesturestart')
              ) {
                console.log('Blocked programmatic click on ad element:', element);
                return; // Don't execute the click
              }
              return originalClick.call(this);
            };

            // Prevent window.open calls that might open ad windows
            const originalWindowOpen = window.open;
            window.open = function(url, target, features) {
              if (url && (url.includes('ads') || url.includes('redirect') || url.includes('click') || url.includes('mobile'))) {
                console.log('Blocked window.open for ad URL:', url);
                return null; // Block the popup
              }
              return originalWindowOpen.call(this, url, target, features);
            };

            // Prevent location changes that might redirect to ads
            let originalLocation = window.location.href;
            Object.defineProperty(window, 'location', {
              get: function() { return originalLocation; },
              set: function(value) {
                if (value && (value.includes('ads') || value.includes('redirect') || value.includes('click') || value.includes('mobile'))) {
                  console.log('Blocked location redirect to ad URL:', value);
                  return; // Don't change location
                }
                originalLocation = value;
                window.location.href = value;
              }
            });

            // Mobile-specific: Prevent context menu and long press ads
            const originalContextMenu = window.addEventListener;
            window.addEventListener = function(type, listener, options) {
              if (type === 'contextmenu' || type === 'longpress' || type === 'taphold') {
                return; // Block context menu and long press that might trigger ads
              }
              return originalContextMenu.call(this, type, listener, options);
            };
          }

          // Remove existing ad elements that might be triggered by interactions (enhanced for mobile)
          function removeDynamicAds() {
            const adSelectors = [
              // Standard ad selectors
              'div[id*="ad"]',
              'div[class*="ad"]',
              'iframe[src*="ads"]',
              'script[src*="ads"]',
              'div[style*="position: fixed"]',
              'div[style*="position: absolute"][style*="z-index"]',
              'a[href*="ads"]',
              'a[href*="redirect"]',
              'a[href*="click"]',
              'div[class*="banner"]',
              'div[class*="popup"]',
              'div[id*="banner"]',
              'div[id*="popup"]',
              // Mobile-specific ad selectors
              'div[class*="interstitial"]',
              'div[class*="overlay"]',
              'div[class*="modal"]',
              'div[id*="interstitial"]',
              'div[id*="overlay"]',
              'div[id*="modal"]',
              // Android/touch device specific
              'div[style*="width: 100%"][style*="height: 100%"]',
              'div[style*="position: fixed"][style*="top: 0"]',
              'div[style*="position: fixed"][style*="bottom: 0"]',
              'div[style*="position: fixed"][style*="left: 0"]',
              'div[style*="position: fixed"][style*="right: 0"]',
              // Touch interaction triggered ads
              'div[ontouchstart]',
              'div[ontouchmove]',
              'div[ontouchend]',
              'div[ongesturestart]',
              'div[ongesturechange]',
              'div[ongestureend]',
              // Mobile ad networks
              'div[class*="mobile-ad"]',
              'div[id*="mobile-ad"]',
              'iframe[class*="mobile"]',
              'script[src*="mobile"]'
            ];

            adSelectors.forEach(selector => {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el.offsetParent !== null || el.getBoundingClientRect().width > 0) {
                  el.remove();
                  console.log('Removed dynamic ad element:', el);
                }
              });
            });

            // Additional mobile-specific cleanup
            function removeMobileAds() {
              // Remove elements that cover significant screen real estate (likely ads)
              const allDivs = document.querySelectorAll('div');
              allDivs.forEach(div => {
                const rect = div.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                // Remove elements that are too large (likely full-screen ads)
                if (rect.width > viewportWidth * 0.8 && rect.height > viewportHeight * 0.8) {
                  if (div.offsetParent !== null) {
                    div.remove();
                    console.log('Removed large overlay ad:', div);
                  }
                }

                // Remove elements with suspicious positioning
                if (div.style.position === 'fixed' || div.style.position === 'absolute') {
                  if (div.style.zIndex && parseInt(div.style.zIndex) > 1000) {
                    div.remove();
                    console.log('Removed high z-index overlay:', div);
                  }
                }
              });
            }

            removeMobileAds();
          }

          // Initialize click ad prevention
          preventClickAds();

          // Run cleanup periodically
          setInterval(removeDynamicAds, 2000);
        }

        // Function to find and click play buttons
        function autoPlay() {
          // Common play button selectors
          const playSelectors = [
            'button[class*="play"]',
            'button[title*="play" i]',
            'button[aria-label*="play" i]',
            'a[class*="play"]',
            'div[class*="play"]',
            '.play-button',
            '.play-btn',
            '#play-button',
            '[onclick*="play"]',
            'button:has(.fa-play)',
            'button:has(.play-icon)'
          ];

          // Try to find and click play buttons
          for (const selector of playSelectors) {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
              if (button.offsetParent !== null) { // Check if visible
                console.log('Found play button:', button);
                button.click();
                return true;
              }
            }
          }

          // Fallback: look for video elements and try to play them
          const videos = document.querySelectorAll('video');
          for (const video of videos) {
            if (video.offsetParent !== null) {
              console.log('Found video element:', video);
              video.play().catch(e => console.log('Auto-play failed:', e));
              return true;
            }
          }

          return false;
        }

        // Initialize ad prevention
        preventAdTriggers();

        // Try to auto-play immediately
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(autoPlay, 1000);
          });
        } else {
          setTimeout(autoPlay, 1000);
        }

        // Also try after a delay in case content loads dynamically
        setTimeout(autoPlay, 3000);
        setTimeout(autoPlay, 5000);
      })();
    </script>
  `;

  // Insert the interaction script before the closing body tag
  filteredHtml = filteredHtml.replace(/<\/body>/i, interactionScript + '</body>');

  return filteredHtml;
}
