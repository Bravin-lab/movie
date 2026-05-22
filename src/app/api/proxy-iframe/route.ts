"use strict";

import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint with ad filtering and strict-click protection.
 * Example:
 *   /api/proxy-iframe?url=https://vidsrc.xyz/embed/movie?tmdb=1234&strict=true
 */
export async function GET(request: NextRequest) {
  // Proxy/iframe functionality is deprecated for the download-first app.
  return NextResponse.json({ error: 'This endpoint has been disabled.' }, { status: 410 });

  /*
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const strict = searchParams.get("strict") === "true"; // enable strict mode

  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }
  */

  /*
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://vidsrc.xyz/",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    let body = await response.text();

    // Filter based on content type
    if (contentType.includes("text/html")) {
      body = filterAdsFromHtml(body, strict);
    }

    if (
      contentType.includes("application/vnd.apple.mpegurl") ||
      contentType.includes("application/x-mpegurl") ||
      url.includes(".m3u8")
    ) {
      body = filterHLSManifest(body);
    }

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "*");
    headers.set("X-Frame-Options", "ALLOWALL");

    return new NextResponse(body, { status: response.status, headers });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
  */
}

/* ================================
   🎬 Filter HLS Manifests (m3u8)
================================= */
function filterHLSManifest(manifestText: string): string {
  const adIndicators = [
    "#EXT-X-DATERANGE:CLASS=\"ad\"",
    "#EXT-X-DATERANGE:ID=\"ad\"",
    "#EXT-X-DATERANGE:CLASS=\"com.apple.ads\"",
    "#EXT-X-DATERANGE:ID=\"preroll\"",
    "#EXT-X-DATERANGE:ID=\"midroll\"",
    "#EXT-X-DATERANGE:ID=\"postroll\"",
    "#EXT-X-CUE",
    "#EXT-X-SCTE35",
    "ad",
    "ads",
    "advert",
    "advertisement",
    "skip",
    "preroll",
    "postroll",
    "midroll",
    "commercial",
    "promo",
    "sponsor",
    "redirect",
    "click",
    "overlay",
    "banner",
    "popup",
    "interstitial",
    "tracking",
    "analytics",
  ];

  const lines = manifestText.split("\n");
  return lines
    .filter((line) => !adIndicators.some((k) => line.toLowerCase().includes(k)))
    .join("\n");
}

/* ================================
   🧠 Filter HTML + Inject Protection
================================= */
function filterAdsFromHtml(html: string, strictMode: boolean = false): string {
  // Remove ad-related scripts and inline handlers
  let filteredHtml = html
    .replace(
      /<script[^>]*>(?:(?!<\/script>).)*(adsbygoogle|doubleclick|popunder|propeller|onclickredirect|window\.open)[\s\S]*?<\/script>/gi,
      ""
    )
    .replace(/<iframe[^>]*(ads|banner|popup|advert)[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<div[^>]*(ads|banner|popup|overlay|interstitial)[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "") // inline JS events
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/<a[^>]*href="[^"]*(ads|click|redirect|popunder)[^"]*"[^>]*>.*?<\/a>/gi, "")
    .replace(/src="[^"]*(doubleclick|adservice|propeller)[^"]*"/gi, 'src=""');

  // Inject protection + optional strict mode
  const injectedScript = `
  <script>
  (() => {
    const blockPopup = (url) => url && /(ads|redirect|click|popunder|propeller|adservice)/i.test(url);

    // Block window.open redirects
    const _open = window.open;
    window.open = (url, ...args) => {
      if (blockPopup(url)) {
        console.log('Blocked popup:', url);
        return null;
      }
      return _open.call(window, url, ...args);
    };

    // Prevent malicious redirects
    const _assign = window.location.assign;
    const _replace = window.location.replace;
    window.location.assign = (url) => !blockPopup(url) && _assign.call(window.location, url);
    window.location.replace = (url) => !blockPopup(url) && _replace.call(window.location, url);

    // Block click-under triggers
    const _addEvent = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, opts) {
      if (type === 'click' || type === 'mousedown') {
        const el = this;
        const href = el.getAttribute?.('href') || '';
        if (blockPopup(href)) {
          console.log('Blocked click redirect:', el);
          return;
        }
      }
      return _addEvent.call(this, type, listener, opts);
    };

    // Clean high-zindex overlays
    const cleanup = () => {
      document.querySelectorAll('div, iframe').forEach(el => {
        const r = el.getBoundingClientRect();
        if (el.style?.zIndex && parseInt(el.style.zIndex) > 1000 && (r.width > 100 || r.height > 100)) {
          el.remove();
        }
      });
    };
    setInterval(cleanup, 1500);

    ${strictMode ? `
      // ⚔️ Strict Mode: adaptive blocking based on device type
      let strictEnabled = true;

      // Detect touchscreen device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

      if (isTouchDevice) {
        // Touchscreen devices: block simulated mouse events, allow native touch
        document.addEventListener('click', (e) => {
          if (!strictEnabled) return;
          const video = document.querySelector('video');
          if (video && video.contains(e.target)) return;
          // Block clicks that aren't from real user interaction (often from scripts)
          if (!e.isTrusted) {
            e.stopImmediatePropagation();
            e.preventDefault();
            console.log('Strict mode blocked untrusted click on touch device:', e.target);
          }
        }, true);

        // Allow touch events but monitor for suspicious patterns
        document.addEventListener('touchstart', (e) => {
          if (!strictEnabled) return;
          const video = document.querySelector('video');
          if (video && video.contains(e.target)) return;
          // Only block if multiple touches or suspicious timing
          if (e.touches.length > 1 || e.changedTouches.length > 1) {
            e.stopImmediatePropagation();
            e.preventDefault();
            console.log('Strict mode blocked multi-touch on touch device:', e.target);
          }
        }, true);
      } else {
        // Mouse devices: block all clicks until video plays
        document.addEventListener('click', (e) => {
          if (!strictEnabled) return;
          const video = document.querySelector('video');
          if (video && video.contains(e.target)) return;
          e.stopImmediatePropagation();
          e.preventDefault();
          console.log('Strict mode blocked click on mouse device:', e.target);
        }, true);

        // Block touch events on mouse devices (rare but possible)
        document.addEventListener('touchstart', (e) => {
          if (!strictEnabled) return;
          e.stopImmediatePropagation();
          e.preventDefault();
          console.log('Strict mode blocked touch on mouse device:', e.target);
        }, true);
      }

      // Disable strict when video starts playing
      const waitVideo = setInterval(() => {
        const v = document.querySelector('video');
        if (v) {
          v.addEventListener('play', () => {
            strictEnabled = false;
            console.log('Strict mode disabled: video playing');
          });
          clearInterval(waitVideo);
        }
      }, 1000);
    ` : ""}
  })();
  </script>
  `;

  filteredHtml = filteredHtml.replace(/<\/body>/i, injectedScript + "</body>");
  return filteredHtml;
}

/* ================================
   🌐 Handle OPTIONS (CORS Preflight)
================================= */
export async function OPTIONS() {
  return NextResponse.json(
    { message: "CORS preflight OK" },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    }
  );
}
