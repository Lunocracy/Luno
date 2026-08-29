var LunoAcornLoader = globalThis.LunoAcornLoader = function LunoAcornLoader() {};

LunoAcornLoader.isReady = function() {
  var globalObj = (typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
  return Boolean(globalObj && globalObj.acorn && typeof globalObj.acorn.parse === 'function');
};

LunoAcornLoader.ensureLoaded = async function() {
  if (LunoAcornLoader.isReady()) {
    var globalObj = (typeof window !== 'undefined' ? window : globalThis);
    return globalObj.acorn;
  }

  // 1. Direct Node.js process require if available
  if (typeof require !== 'undefined') {
    try {
      var a = require('acorn');
      if (typeof window !== 'undefined') window.acorn = a;
      globalThis.acorn = a;
      if (LunoAcornLoader.isReady()) return a;
    } catch (e) {}
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  var isStatic = false;
  try {
    if (typeof LunoFileSystem !== 'undefined' && typeof LunoFileSystem.isStaticHosting === 'function') {
      isStatic = LunoFileSystem.isStaticHosting();
    } else if (typeof LunoLoader !== 'undefined' && typeof LunoLoader.isStaticHosting === 'function') {
      isStatic = LunoLoader.isStaticHosting();
    }
  } catch (e) {}

  var localSources = [
    '/node_modules/acorn/dist/acorn.js',
    './node_modules/acorn/dist/acorn.js',
    '/vendor/acorn.js',
    './vendor/acorn.js'
  ];

  var cdnSources = [
    'https://cdnjs.cloudflare.com/ajax/libs/acorn/8.11.3/acorn.min.js',
    'https://unpkg.com/acorn@8.11.3/dist/acorn.js',
    'https://cdn.jsdelivr.net/npm/acorn@8.11.3/dist/acorn.min.js'
  ];

  // Offline-first when on local development server; CDN-first when hosted on static GitHub Pages
  var candidateUrls = isStatic
    ? cdnSources.concat(localSources)
    : localSources.concat(cdnSources);

  for (var i = 0; i < candidateUrls.length; i++) {
    var url = candidateUrls[i];
    try {
      await LunoAcornLoader.loadScriptTag(url);
      if (LunoAcornLoader.isReady()) {
        var loadedAcorn = window.acorn || globalThis.acorn;
        window.acorn = loadedAcorn;
        globalThis.acorn = loadedAcorn;
        console.log('[Luno Acorn Engine] AST Parser online from: ' + url);
        return loadedAcorn;
      }
    } catch (err) {}
  }

  console.warn('[Luno Acorn Engine] All Acorn script endpoints were unreachable.');
  return null;
};

LunoAcornLoader.loadScriptTag = function(url) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = url;
    s.async = false;
    s.onload = function() { resolve(); };
    s.onerror = function(err) {
      if (s.parentNode) s.parentNode.removeChild(s);
      reject(err || new Error('Failed to load: ' + url));
    };
    document.head.appendChild(s);
  });
};

if (typeof window !== 'undefined') window.LunoAcornLoader = LunoAcornLoader;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoAcornLoader;