class LunoSettings {
  /**
   * ⚙️ CONSTRUCTOR: LunoSettings()
   */
  constructor() {

  }

  static DEFAULTS = {
    executionPace: 'methodical',
    autoApprove: false,
    activeDockView: 'workspace',
    verbosityLevel: 'chatty',
    maxPackageSize: 500000,
    timerDuration: 3500,
    isLightMode: false,
    hueRotate: 0,
    contrast: 100,
    fontSize: 13,
    glowLevel: 50,
    glowEnabled: true,
    themeWidgetExpanded: true,
    acornSource: 'auto',
    hotPatchMemoryMode: true
  };
  static KEYS = {
    executionPace: 'luno_execution_pace',
    autoApprove: 'luno_auto_approve',
    activeDockView: 'luno_active_dock_view',
    verbosityLevel: 'luno_verbosity_level',
    maxPackageSize: 'luno_max_pkg_size',
    timerDuration: 'luno_timer_duration',
    isLightMode: 'luno_is_light_mode',
    hueRotate: 'luno_hue_rotate',
    contrast: 'luno_contrast',
    fontSize: 'luno_font_size',
    glowEnabled: 'luno_glow',
    glowLevel: 'luno_glow_level',
    themeWidgetExpanded: 'luno_theme_widget_expanded',
    acornSource: 'luno_acorn_source',
    hotPatchMemoryMode: 'luno_hotpatch_memory_mode'
  };

  /**
   * ⚙️ METHOD: getItem(key, fallback = null)
   * - Type: Static Method
   * - Modifier: sync
   */
  static getItem(key, fallback = null) {

    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {}
    return fallback;

  }
  /**
   * ⚙️ METHOD: setItem(key, val)
   * - Type: Static Method
   * - Modifier: sync
   */
  static setItem(key, val) {

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, String(val));
      }
    } catch (e) {}

  }
  /**
   * ⚙️ METHOD: hotPatchMemoryMode()
   * - Type: Static Method
   * - Modifier: sync
   */
  static hotPatchMemoryMode() {

    const raw = LunoSettings.getItem(LunoSettings.KEYS.hotPatchMemoryMode);
    return raw !== null ? raw === 'true' : LunoSettings.DEFAULTS.hotPatchMemoryMode;

  }
  /**
   * ⚙️ METHOD: setHotPatchMemoryMode(val)
   * - Type: Static Method
   * - Modifier: sync
   */
  static setHotPatchMemoryMode(val) {

    LunoSettings.setItem(LunoSettings.KEYS.hotPatchMemoryMode, Boolean(val));

  }
}

globalThis.LunoSettings = LunoSettings;
if (typeof module !== "undefined" && module.exports) module.exports = LunoSettings;