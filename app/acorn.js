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

    console.warn('[Luno Acorn Engine] CDNs unreachable. Falling back to local server endpoint (/vendor/acorn.js)...');
    try {
      await LunoAcornLoader.loadScriptTag('/vendor/acorn.js');
      if (LunoAcornLoader.isReady()) {
        console.log('[Luno Acorn Engine] Successfully loaded from local server fallback (/vendor/acorn.js)');
        if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
          ClientApp.showToast('⚠️ Offline mode: Loaded local server Acorn fallback', 'info', '⚡');
        }
        return window.acorn;
      }
    } catch (localErr) {
      console.error('[Luno Acorn Engine] Local server fallback failed:', localErr);
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