self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname === 'vidsrc.xyz' || url.hostname.endsWith('.vidsrc.xyz')) {
    // Proxy the request through our API
    const proxyUrl = `/api/proxy-stream?url=${encodeURIComponent(event.request.url)}`;
    event.respondWith(fetch(proxyUrl, {
      method: event.request.method,
      headers: event.request.headers,
      body: event.request.body
    }));
  }
});
