var LunoAcornLoader = window.LunoAcornLoader = function LunoAcornLoader() {};

window.LunoAcornLoader.isReady = function() {
  return typeof window !== 'undefined' && window.acorn && typeof window.acorn.parse === 'function';
};

window.LunoAcornLoader.ensureLoaded = async function() {
  if (LunoAcornLoader.isReady()) return window.acorn;

  if (typeof require !== 'undefined') {
    try {
      const a = require('acorn');
      if (typeof window !== 'undefined') window.acorn = a;
      if (LunoAcornLoader.isReady()) return window.acorn;
    } catch (e) {}
  }

  if (typeof window === 'undefined') return null;

  const cdnSources = [
    { name: 'Cloudflare CDN', url: 'https://cdnjs.cloudflare.com/ajax/libs/acorn/8.11.3/acorn.min.js' },
    { name: 'unpkg CDN', url: 'https://unpkg.com/acorn@8.11.3/dist/acorn.js' },
    { name: 'jsDelivr CDN', url: 'https://cdn.jsdelivr.net/npm/acorn@8.11.3/dist/acorn.min.js' }
  ];

  for (const cdn of cdnSources) {
    try {
      await LunoAcornLoader.loadScriptTag(cdn.url);
      if (LunoAcornLoader.isReady()) {
        console.log('[Luno Acorn Engine] Successfully loaded from primary ' + cdn.name);
        return window.acorn;
      }
    } catch (err) {}
  }

  console.warn('[Luno Acorn Engine] CDNs unreachable. Falling back to local script endpoint...');
  const localFallbacks = [
    './app/acorn.js',
    '/app/acorn.js',
    './vendor/acorn.js',
    '/vendor/acorn.js'
  ];

  for (const fallbackUrl of localFallbacks) {
    try {
      await LunoAcornLoader.loadScriptTag(fallbackUrl);
      if (LunoAcornLoader.isReady()) {
        console.log('[Luno Acorn Engine] Loaded from local fallback: ' + fallbackUrl);
        return window.acorn;
      }
    } catch (localErr) {}
  }

  return null;
};

window.LunoAcornLoader.loadScriptTag = function(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
};

if (typeof window !== 'undefined') window.LunoAcornLoader = LunoAcornLoader;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoAcornLoader;