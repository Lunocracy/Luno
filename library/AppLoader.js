class AppLoader {
  static async loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src + (src.includes('?') ? '&' : '?') + 'v=' + Date.now();
      s.async = false;
      s.onload = () => resolve(src);
      s.onerror = () => reject(new Error('Failed to load script: ' + src));
      document.head.appendChild(s);
    });
  }

  static async loadStyle(href) {
    return new Promise((resolve, reject) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href + (href.includes('?') ? '&' : '?') + 'v=' + Date.now();
      l.onload = () => resolve(href);
      l.onerror = () => reject(new Error('Failed to load stylesheet: ' + href));
      document.head.appendChild(l);
    });
  }

  static async loadApp(containerId = 'app-root') {
    const root = document.getElementById(containerId) || document.body;

    try {
      const res = await fetch('luno.json?v=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching luno.json');
      const config = await res.json();

      if (Array.isArray(config.styles)) {
        for (const style of config.styles) {
          await AppLoader.loadStyle(style);
        }
      }

      if (Array.isArray(config.library)) {
        for (const lib of config.library) {
          const libPath = lib.startsWith('library/') ? lib : ('library/' + lib);
          await AppLoader.loadScript(libPath);
        }
      }

      if (Array.isArray(config.main)) {
        for (const file of config.main) {
          await AppLoader.loadScript(file);
        }
      }

      if (typeof DomBasics !== 'undefined' && typeof DomBasics.run === 'function') {
        DomBasics.run();
      }

      const entryClass = (config.entrypoint && config.entrypoint.class) || config.mainClass || 'SituationApp';
      const entryMethod = (config.entrypoint && config.entrypoint.method) || 'run';

      let TargetClass = window[entryClass] || globalThis[entryClass] || window.SituationApp || window.AccuDrawValuation;
      if (!TargetClass) {
        try { TargetClass = eval(entryClass); } catch (e) {}
      }

      if (typeof TargetClass !== 'function') {
        throw new Error('Entrypoint class "' + entryClass + '" could not be resolved on window scope.');
      }

      const appInstance = new TargetClass();
      if (typeof appInstance[entryMethod] === 'function') {
        await appInstance[entryMethod]({ container: root, config });
      } else if (typeof appInstance.run === 'function') {
        await appInstance.run({ container: root, config });
      } else {
        throw new Error('Entrypoint method "' + entryMethod + '" not found on ' + entryClass);
      }

    } catch (err) {
      console.error('[AppLoader Exception]', err);
      root.innerHTML = '<div style="padding: 24px; color: #f87171; background: #0f172a; border: 1px solid #ef4444; border-radius: 8px; font-family: monospace;">' +
        '<h3 style="margin-top:0;">⚠️ Application Boot Failure</h3>' +
        '<pre style="white-space: pre-wrap;">' + (err.stack || err.message) + '</pre>' +
        '</div>';
    }
  }
}

window.AppLoader = AppLoader;
globalThis.AppLoader = AppLoader;