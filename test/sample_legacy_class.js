class SampleLegacyWidget {
  constructor(options) {

    options = options || {};
    this.title = options.title || 'Legacy Widget';
    this.enabled = true;
    this.metrics = [];

  }

  static VERSION = '1.0.0-legacy';
  static MAX_ITEMS = 100;

  static createDefault(title) {

    return new SampleLegacyWidget({ title: title });

  }
  static isSupported() {

    return typeof window !== 'undefined';

  }

  init() {

    console.log('[SampleLegacyWidget] Initializing:', this.title);
    return this.enabled;

  }
  async fetchData(endpoint, options) {

    options = options || {};
    try {
      var res = await fetch(endpoint || '/api/ping', options);
      var data = await res.json();
      this.metrics.push(data);
      return data;
    } catch (err) {
      console.error('[SampleLegacyWidget] Fetch error:', err);
      throw err;
    } finally {
      console.log('[SampleLegacyWidget] Fetch cycle completed');
    }

  }
  processItems(multiplier, ...items) {

    var self = this;
    if (!items || items.length === 0) return [];
    return items.map(item => {
      return { item: item, val: (item.value || 0) * (multiplier || 1), parent: self.title };
    });

  }
}

globalThis.SampleLegacyWidget = SampleLegacyWidget;
if (typeof module !== "undefined" && module.exports) module.exports = SampleLegacyWidget;