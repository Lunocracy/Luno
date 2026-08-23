class BookmarkletUI {
  constructor() {

  }

  static makeElement(tag, attrs) {

    var el = document.createElement(tag || "div");
    if (attrs && typeof attrs === "object") {
      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) {
          var val = attrs[key];
          if (key.indexOf("on") === 0 && typeof val === "function") {
            el.addEventListener(key.slice(2).toLowerCase(), val);
          } else if (key === "style") {
            if (typeof val === "object") {
              for (var s in val) {
                if (Object.prototype.hasOwnProperty.call(val, s)) {
                  el.style[s] = val[s];
                }
              }
            } else {
              el.style.cssText = String(val);
            }
          } else if (key === "className" || key === "class") {
            el.className = String(val);
          } else {
            try { el[key] = val; } catch (e) { el.setAttribute(key, val); }
          }
        }
      }
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child !== null && child !== undefined) {
        if (Array.isArray(child)) {
          for (var j = 0; j < child.length; j++) {
            if (child[j] !== null && child[j] !== undefined) {
              if (typeof child[j] === "string" || typeof child[j] === "number") {
                el.appendChild(document.createTextNode(String(child[j])));
              } else if (child[j] instanceof Node) {
                el.appendChild(child[j]);
              }
            }
          }
        } else if (typeof child === "string" || typeof child === "number") {
          el.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
          el.appendChild(child);
        }
      }
    }
    return el;

  }
  static renderWorkshop(container, appInstance) {

    if (!container) return;
    container.innerHTML = "";
    var m = BookmarkletUI.makeElement;

    var header = m("div", { style: { marginBottom: "0.75rem", borderBottom: "1px solid #30363d", paddingBottom: "0.5rem" } },
      m("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        m("h1", { style: { margin: "0", fontSize: "1.4rem", color: "#00f2fe", fontFamily: "monospace" } }, "Bookmarklet Workshop"),
        m("span", { style: { fontSize: "0.7rem", color: "#3fb950", background: "#0d2818", border: "1px solid #238636", padding: "0.2rem 0.5rem", borderRadius: "10px", fontWeight: "bold" } }, "[RELAY TERMINAL v1.0.5 - ACTIVE]")
      )
    );

    var btnScan = m("button", {
      style: { padding: "0.35rem 0.55rem", background: "#21262d", color: "#00f2fe", border: "1px solid #00f2fe", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold", cursor: "pointer", fontFamily: "monospace" },
      onclick: function() { if (appInstance) appInstance.requestTargetScan(); }
    }, "Scan AI Studio");

    var btnGetQueue = m("button", {
      style: { padding: "0.35rem 0.55rem", background: "#271052", color: "#d2a8ff", border: "1px solid #8257e5", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold", cursor: "pointer", fontFamily: "monospace" },
      onclick: function() { if (appInstance) appInstance.requestTargetQueue(); }
    }, "Request Queue");

    var btnClearQueue = m("button", {
      style: { padding: "0.35rem 0.55rem", background: "#161b22", color: "#ff7b72", border: "1px solid #da3633", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold", cursor: "pointer", fontFamily: "monospace" },
      onclick: function() { if (appInstance) appInstance.clearTargetQueue(); }
    }, "Clear Queue");

    var driverRow = m("div", { style: { display: "flex", gap: "0.4rem", marginBottom: "0.5rem", flexWrap: "wrap" } },
      btnScan,
      btnGetQueue,
      btnClearQueue
    );

    var queueInspectorBox = m("div", {
      id: "relay-queue-inspector-box",
      style: {
        maxHeight: "100px",
        overflowY: "auto",
        background: "#070a13",
        border: "1px solid #30363d",
        borderRadius: "6px",
        padding: "0.4rem",
        color: "#8b949e",
        fontSize: "0.72rem",
        fontFamily: "monospace",
        marginBottom: "0.5rem"
      }
    }, "No queued blocks from AI Studio. Click 'Request Queue' to fetch.");

    var relayTerminalCard = m("div", {
      id: "relay-terminal-card",
      style: {
        background: "#0d1117",
        border: "1px solid #8257e5",
        borderRadius: "8px",
        padding: "0.75rem",
        marginBottom: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem"
      }
    },
      m("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        m("strong", { style: { color: "#d2a8ff", fontSize: "0.85rem" } }, "Host Message Relay & Remote Query Driver"),
        m("span", {
          id: "relay-status-badge",
          style: {
            color: "#d2a8ff",
            background: "#271052",
            border: "1px solid #8257e5",
            padding: "0.15rem 0.55rem",
            borderRadius: "10px",
            fontSize: "0.7rem",
            fontWeight: "bold"
          }
        }, "Listening for AI Studio...")
      ),
      driverRow,
      queueInspectorBox,
      m("div", {
        id: "relay-log-box",
        style: {
          height: "90px",
          overflowY: "auto",
          background: "#070a13",
          border: "1px solid #30363d",
          borderRadius: "6px",
          padding: "0.5rem",
          color: "#7ee787",
          fontSize: "0.75rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontFamily: "monospace"
        }
      }, "Waiting for incoming target page messages..."),
      m("div", { style: { display: "flex", gap: "0.4rem" } },
        m("input", {
          id: "relay-host-reply-in",
          type: "text",
          placeholder: "Type reply back to AI Studio page...",
          style: {
            flex: "1",
            background: "#070a13",
            border: "1px solid #30363d",
            color: "#00f2fe",
            padding: "0.35rem 0.5rem",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontFamily: "monospace",
            outline: "none"
          }
        }),
        m("button", {
          style: {
            padding: "0.35rem 0.65rem",
            background: "#8257e5",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontWeight: "bold",
            cursor: "pointer",
            fontFamily: "monospace"
          },
          onclick: function() {
            var input = document.getElementById("relay-host-reply-in");
            var val = input ? input.value.trim() : "";
            if (!val) return;
            if (appInstance && typeof appInstance.sendHostMessageToTarget === "function") {
              appInstance.sendHostMessageToTarget(val);
            }
            if (input) input.value = "";
          }
        }, "Send Reply")
      )
    );

    var metricsBadge = m("div", {
      id: "bookmarklet-metrics-badge",
      style: {
        fontSize: "0.72rem",
        color: "#00f2fe",
        fontFamily: "monospace",
        marginBottom: "0.75rem",
        background: "#070a13",
        border: "1px solid #30363d",
        padding: "0.4rem 0.6rem",
        borderRadius: "6px"
      }
    }, "Metrics: Select or generate a bookmarklet...");

    var presets = typeof BookmarkletPresets !== "undefined" ? BookmarkletPresets.getPresets() : [];
    var presetOptions = presets.map(function(p) {
      return m("option", { value: p.id }, p.title);
    });

    var sourceArea = m("textarea", {
      id: "bookmarklet-source",
      style: {
        width: "100%",
        minHeight: "200px",
        resize: "vertical",
        padding: "0.75rem",
        border: "1px solid #30363d",
        borderRadius: "8px",
        background: "#070a13",
        color: "#7ee787",
        fontFamily: "monospace",
        fontSize: "12px",
        outline: "none",
        boxSizing: "border-box"
      },
      placeholder: "// JavaScript source code..."
    });

    sourceArea.value = appInstance.getSource();

    function updateMetrics() {
      var src = sourceArea.value || "";
      var encoded = (typeof appInstance.generate === "function") ? appInstance.generate() : "";
      var lines = src.split(/\r?\n/).length;
      var rawChars = src.length;
      var encChars = encoded.length;

      var isSafe = encChars < 2000;
      metricsBadge.style.borderColor = isSafe ? "#238636" : "#da3633";
      metricsBadge.style.color = isSafe ? "#7ee787" : "#ff7b72";
      metricsBadge.textContent = "Metrics: " + lines + " lines | " + rawChars + " raw chars | Encoded: " + encChars + " chars " + (isSafe ? "(Safe < 2000)" : "(Warning > 2000)");
    }

    sourceArea.oninput = function() {
      appInstance.onSourceChanged(sourceArea.value);
      updateMetrics();
    };

    var presetSelect = m("select", {
      id: "preset-dropdown-select",
      style: {
        width: "100%",
        background: "#0d1117",
        color: "#00f2fe",
        border: "1px solid #00f2fe",
        padding: "0.6rem 0.8rem",
        borderRadius: "8px",
        fontSize: "0.85rem",
        fontFamily: "monospace",
        fontWeight: "bold",
        cursor: "pointer",
        marginBottom: "0.75rem",
        outline: "none"
      },
      onchange: function(e) {
        var selectedId = e.target.value;
        var targetPreset = presets.find(function(p) { return p.id === selectedId; });
        if (targetPreset) {
          appInstance.loadPreset(targetPreset);
          updateMetrics();
        }
      }
    }, presetOptions);

    var btnGenerate = m("button", {
      style: { padding: "0.6rem 0.9rem", background: "#8257e5", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" },
      onclick: function() { appInstance.generate(); updateMetrics(); }
    }, "Generate Bookmarklet");

    var btnCopyBookmarklet = m("button", {
      style: { padding: "0.6rem 0.9rem", background: "#238636", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" },
      onclick: function(e) { appInstance.copyBookmarklet(e.target); }
    }, "Copy Bookmarklet");

    var buttonRow = m("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "0.75rem 0" } },
      btnGenerate,
      btnCopyBookmarklet
    );

    var bookmarkletLink = m("a", {
      id: "bookmarklet-link",
      href: "#",
      style: {
        display: "inline-block",
        color: "#00f2fe",
        fontWeight: "bold",
        textDecoration: "none",
        padding: "0.5rem 0.8rem",
        borderRadius: "6px",
        background: "#0d2d4a",
        border: "1px solid #58a6ff66",
        wordBreak: "break-all",
        fontFamily: "monospace",
        fontSize: "0.8rem"
      }
    }, "Run Bookmarklet");

    var encodedOutput = m("textarea", {
      id: "bookmarklet-encoded",
      readOnly: true,
      style: {
        marginTop: "0.5rem",
        width: "100%",
        minHeight: "80px",
        background: "#070a13",
        color: "#8b949e",
        border: "1px solid #30363d",
        borderRadius: "6px",
        padding: "0.5rem",
        fontFamily: "monospace",
        fontSize: "11px",
        boxSizing: "border-box"
      }
    });

    var resultBox = m("div", {
      style: {
        marginTop: "0.75rem",
        padding: "0.85rem",
        border: "1px solid #30363d",
        borderRadius: "8px",
        background: "#161b22"
      }
    },
      m("label", { style: { display: "block", marginBottom: "0.3rem", color: "#8b949e", fontSize: "0.75rem", fontWeight: "bold" } }, "Generated Bookmarklet Link:"),
      bookmarkletLink,
      m("label", { style: { display: "block", marginTop: "0.75rem", marginBottom: "0.2rem", color: "#8b949e", fontSize: "0.75rem", fontWeight: "bold" } }, "Bookmarklet Output & Length:"),
      encodedOutput
    );

    container.appendChild(header);
    container.appendChild(relayTerminalCard);
    container.appendChild(metricsBadge);
    container.appendChild(presetSelect);
    container.appendChild(sourceArea);
    container.appendChild(buttonRow);
    container.appendChild(resultBox);

    setTimeout(updateMetrics, 100);

  }
}

globalThis.BookmarkletUI = BookmarkletUI;
if (typeof module !== "undefined" && module.exports) module.exports = BookmarkletUI;