var LunoLoader = globalThis.LunoLoader = class LunoLoader {
  constructor() {}

  static loadedScripts = new Set([
    'LunoLoader.js',
    '/app/LunoLoader.js',
    './app/LunoLoader.js',
    '/Luno/app/LunoLoader.js',
    'Luno/app/LunoLoader.js',
    '/Library/LunoLoader.js',
    './Library/LunoLoader.js',
    './library/LunoLoader.js',
    'Library/LunoLoader.js',
    'library/LunoLoader.js'
  ]);
  static loadedStyles = new Set();

  static isStaticHosting() {
    try {
      if (typeof window !== 'undefined' && window.location) {
        var host = window.location.hostname || '';
        return host.endsWith('github.io') || host.endsWith('pages.dev') || window.location.protocol === 'file:';
      }
    } catch (e) {}
    return false;
  }

  static getLibraryRoot() {
    if (LunoLoader.isStaticHosting()) {
      return './library/';
    }
    return '/Library/';
  }

  static loadStyle(cssPath) {
    return new Promise(function(resolve, reject) {
      var isStatic = LunoLoader.isStaticHosting();
      var fullUrl = cssPath;
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = isStatic ? (cssPath.startsWith('/') ? ('.' + cssPath) : cssPath) : (cssPath.startsWith('/') ? cssPath : ('/' + cssPath));
      }
      if (LunoLoader.loadedStyles.has(fullUrl)) return resolve({ url: fullUrl, cached: true });

      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fullUrl + (fullUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
      link.onload = function() { LunoLoader.loadedStyles.add(fullUrl); resolve({ url: fullUrl, cached: false }); };
      link.onerror = function() { reject(new Error('Failed to load stylesheet: ' + cssPath)); };
      document.head.appendChild(link);
    });
  }

  static loadScript(jsPath) {
    return new Promise(function(resolve, reject) {
      var isStatic = LunoLoader.isStaticHosting();
      var fullUrl = jsPath;
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = isStatic ? (jsPath.startsWith('/') ? ('.' + jsPath) : jsPath) : (jsPath.startsWith('/') ? jsPath : ('/' + jsPath));
      }

      var cleanName = jsPath.split('?')[0].split('/').pop();
      if (cleanName === 'LunoLoader.js' && typeof globalThis.LunoLoader !== 'undefined') {
        LunoLoader.loadedScripts.add(fullUrl);
        return resolve({ url: fullUrl, cached: true });
      }

      if (LunoLoader.loadedScripts.has(fullUrl) || LunoLoader.loadedScripts.has(jsPath)) {
        return resolve({ url: fullUrl, cached: true });
      }

      var script = document.createElement('script');
      script.src = fullUrl + (fullUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
      script.async = false;
      script.onload = function() {
        LunoLoader.loadedScripts.add(fullUrl);
        LunoLoader.loadedScripts.add(jsPath);
        resolve({ url: fullUrl, cached: false });
      };
      script.onerror = function() {
        reject(new Error('Failed to load script: ' + jsPath));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * ⚙️ METHOD: applyPatchLog(projectName)
   * Hardened live runtime patch evaluator for methods, getters, setters, generators, and full file overrides.
   */
  static async applyPatchLog(projectName) {
    if (LunoLoader.isStaticHosting()) {
      return { appliedCount: 0, note: 'Static hosting mode' };
    }

    try {
      var targetProj = projectName || 'Luno';
      var res = await fetch('/api/fs/read?path=LunoPatchLog.html&project=' + encodeURIComponent(targetProj) + '&v=' + Date.now());
      var data = await res.json();
      if (!res.ok || !data || !data.content || !data.content.trim()) return { appliedCount: 0, note: 'Patch log empty' };

      var parser = globalThis.LunoPayloadParser || globalThis.LunoContainerParser;
      if (!parser || typeof parser.parsePatchLog !== 'function') return { appliedCount: 0, error: 'Parser unavailable' };

      var parsed = parser.parsePatchLog(data.content);
      var files = parsed.files || [];
      var appliedCount = 0;

      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (!f || !f.filePath) continue;

        var norm = f.filePath.replace(/\\/g, '/').replace(/^\/+/, '');
        var isForTarget = (targetProj === 'Luno')
          ? (norm.startsWith('Luno/') || !norm.includes('/') || norm.startsWith('app/') || norm.startsWith('browser/') || norm.startsWith('core/') || norm.startsWith('docs/') || norm.startsWith('test/'))
          : (norm.startsWith(targetProj + '/') || norm.startsWith('Library/'));

        if (!isForTarget) continue;

        // 1. Surgical Method / Property Patch
        if (f.methodSpec) {
          var spec = f.methodSpec.replace(/^(?:globalThis|window)\./, '').trim();
          var isProto = spec.includes('.prototype.');
          var kind = 'method'; // 'method', 'get', 'set'

          if (spec.startsWith('get ') || spec.includes('.get ')) {
            kind = 'get';
            spec = spec.replace(/\bget\s+/, '');
          } else if (spec.startsWith('set ') || spec.includes('.set ')) {
            kind = 'set';
            spec = spec.replace(/\bset\s+/, '');
          }

          var className = '';
          var memberName = '';

          if (isProto) {
            var pParts = spec.split('.prototype.');
            className = pParts[0].trim();
            memberName = pParts[1].trim();
          } else if (spec.includes('.')) {
            var dParts = spec.split('.');
            memberName = dParts.pop().trim();
            className = dParts.join('.').trim();
          } else {
            memberName = spec;
          }

          // Target object resolution
          var targetClass = globalThis[className];
          if (!targetClass && typeof window !== 'undefined') targetClass = window[className];

          var targetObj = null;
          if (targetClass) {
            if (isProto || (targetClass.prototype && (memberName in targetClass.prototype || typeof targetClass.prototype[memberName] === 'function'))) {
              targetObj = targetClass.prototype;
            } else {
              targetObj = targetClass;
            }
          }

          // Handle live deletion action
          if (f.action === 'delete') {
            if (targetObj && memberName) {
              delete targetObj[memberName];
              appliedCount++;
            }
            continue;
          }

          if (!f.content || !f.content.trim()) continue;

          var fnCode = f.content.trim();
          if (fnCode.endsWith(';')) fnCode = fnCode.slice(0, -1).trim();

          // Header inspection
          var headerMatch = fnCode.match(/^(?:(static)\s+)?(?:(async)\s+)?(\*)?\s*(?:(get|set)\s+)?([A-Za-z0-9_$#]+)\s*(\([\s\S]*?\))?\s*(\{[\s\S]*\})$/);
          var isAsync = Boolean(headerMatch && headerMatch[2]) || fnCode.includes('await ');
          var isGenerator = Boolean(headerMatch && headerMatch[3]);
          var memberKind = (headerMatch && headerMatch[4]) || kind;
          var params = (headerMatch && headerMatch[6]) || '()';
          var body = (headerMatch && headerMatch[7]) || (fnCode.indexOf('{') !== -1 ? fnCode.slice(fnCode.indexOf('{')) : ('{ ' + fnCode + ' }'));

          var fnExpr = '';
          if (memberKind === 'get' || memberKind === 'set') {
            fnExpr = (isAsync ? 'async function' : 'function') + params + ' ' + body;
          } else {
            var genPrefix = isGenerator ? '*' : '';
            var asyncPrefix = isAsync ? 'async ' : '';
            fnExpr = asyncPrefix + 'function' + genPrefix + params + ' ' + body;
          }

          try {
            var evalFn = new Function('return (' + fnExpr + ');')();

            if (targetObj) {
              if (memberKind === 'get') {
                Object.defineProperty(targetObj, memberName, {
                  get: evalFn,
                  configurable: true,
                  enumerable: true
                });
              } else if (memberKind === 'set') {
                Object.defineProperty(targetObj, memberName, {
                  set: evalFn,
                  configurable: true,
                  enumerable: true
                });
              } else {
                targetObj[memberName] = evalFn;
              }
              appliedCount++;
            }
          } catch(evalErr) {
            console.warn('[LunoLoader] Runtime patch evaluation failed for ' + spec + ':', evalErr.message);
          }
        }
        // 2. Full File Live Override in Patch Log
        else if (f.content && f.action !== 'delete') {
          try {
            var execFn = new Function('globalThis', f.content);
            execFn(globalThis);
            appliedCount++;
          } catch(fileErr) {
            console.warn('[LunoLoader] Runtime full file patch failed for ' + norm + ':', fileErr.message);
          }
        }
      }

      if (appliedCount > 0 && typeof LunoPlaybackLogger !== 'undefined') {
        LunoPlaybackLogger.patch('Runtime Patches Applied', 'Evaluated ' + appliedCount + ' live patch(es) from LunoPatchLog.html for [' + targetProj + ']');
      }

      return { appliedCount: appliedCount, targetProject: targetProj };
    } catch(err) {
      console.warn('[LunoLoader] applyPatchLog exception:', err);
      return { appliedCount: 0, error: err.message };
    }
  }

        static async loadApp(containerId) {
      var targetContainer = typeof containerId === 'string'
        ? document.getElementById(containerId)
        : (containerId || document.getElementById('app-root') || document.body);
  
      var lunoMeta = {};
      try {
        var res = await fetch('luno.json?v=' + Date.now());
        if (res.ok) lunoMeta = await res.json();
      } catch(e){}
  
      var libRoot = LunoLoader.getLibraryRoot();
      var libs = Array.isArray(lunoMeta.library) ? lunoMeta.library : [];
      var main = Array.isArray(lunoMeta.main) ? lunoMeta.main : [];
      var styles = Array.isArray(lunoMeta.styles) ? lunoMeta.styles : [];
  
      for (var s = 0; s < styles.length; s++) {
        try { await LunoLoader.loadStyle(styles[s]); } catch(e){}
      }
  
      for (var l = 0; l < libs.length; l++) {
        var cleanLib = libs[l].replace(/^Library\//i, '').replace(/^library\//i, '').replace(/^\/+/, '');
        try { await LunoLoader.loadScript(libRoot + cleanLib); } catch(e){}
      }
  
      if (typeof DomBasics !== 'undefined' && typeof DomBasics.run === 'function') {
        DomBasics.run();
      }
  
      for (var m = 0; m < main.length; m++) {
        try { await LunoLoader.loadScript(main[m]); } catch(e){}
      }
  
      try {
        await LunoLoader.applyPatchLog(lunoMeta.name || 'Luno');
      } catch(e){}
  
      var entryClass = (lunoMeta.entrypoint && lunoMeta.entrypoint.class) || lunoMeta.mainClass;
      var entryMethod = (lunoMeta.entrypoint && lunoMeta.entrypoint.method) || 'run';
  
      if (entryClass && typeof window[entryClass] === 'function') {
        var AppCls = window[entryClass];
        var envCtx = { container: targetContainer, config: lunoMeta, isStatic: LunoLoader.isStaticHosting() };
        if (typeof AppCls[entryMethod] === 'function') {
          await AppCls[entryMethod](envCtx);
        } else {
          var inst = new AppCls();
          if (typeof inst[entryMethod] === 'function') await inst[entryMethod](envCtx);
          else if (typeof inst.run === 'function') await inst.run(envCtx);
        }
      }
    }
};

if (typeof module !== "undefined" && module.exports) module.exports = LunoLoader;