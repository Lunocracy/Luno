# 🚀 Luno Google AI Studio Collapsible Code Block Widget Suite

## 1. Executive Summary
This document details the completed **10-Step Collapsible Code Block Widget & Bidirectional Relay Architecture** built specifically for **Google AI Studio (`aistudio.google.com`)**.

The suite detects, filters, wraps, and compresses JavaScript code blocks output by Gemini in AI Studio, turning them into collapsible widgets with sharp square borders, line counters, and 1-tap bidirectional handoffs to Luno Workspace (`http://localhost:8888`).

---

## 2. Completed 10-Step Implementation Roadmap

| Step | Milestone Component | Responsibility & Features |
| :--- | :--- | :--- |
| **1** | `LunoRelayProtocol.js` | Defines structured cross-window message envelopes (`LUNO_PING`, `LUNO_CMD_SCAN`, `LUNO_CODE_DISCOVERED`, `LUNO_SEND_INBOX`, `LUNO_OUTBOX_NOTIFY`). |
| **2** | `BookmarkletPresets.js` | AI Studio target DOM observer using `MutationObserver` + 2s polling loop targeting `ms-code-block` and `<pre>` elements. |
| **3** | `JsLanguageDetector.js` | Filtering engine checking AI Studio language headers, AST tokens (`const`, `let`, `function`, `=>`, `async`, `import`), and excluding bash logs. |
| **4** | `CodeCollapserWidget.js` | Component builder enforcing sharp square borders (`border-radius: 0px !important`), thick cyan collapsed borders (`3px solid #00f2fe`), thin expanded borders (`1px solid #0088cc`), and line count headers. |
| **5** | Dynamic State Machine | Controls live streaming updates: recalculates line counts as Gemini streams text without resetting user collapse/expand choices. |
| **6** | `AiStudioQueue.js` | Target-side in-memory staging buffer holding tracked JS blocks with deduplication and `LUNO_CMD_GET_QUEUE` response handlers. |
| **7** | Luno Host Driver | Relay Terminal controls on Luno (`[🔍 Scan AI Studio]`, `[📥 Request Queue]`, `[🧹 Clear Queue]`) with live queue inspector. |
| **8** | `OutboxNotifier.js` | Outbound notification banner on AI Studio (`📥 Luno Outbox Ready!`) with 1-tap `[📋 Fill Prompt Field]` prompt injection. |
| **9** | Bidirectional Handoff | Direct 1-tap code block transfer from AI Studio widget to Luno Inbox, triggering change detection and AST diff approval. |
| **10**| Self-Healing & Diagnostics | Cross-window heartbeat pings (`verifyConnection`) and self-test diagnostic presets (`AAAAAAAAAA 0. AI Studio Diagnostic Test`). |

---

## 3. Visual & Component Specifications
- **Collapsed Widget**: Height limit `110px`, thick cyan border `3px solid #00f2fe`, sharp square edges (`0px`), top header showing `📊 JS Code Block (XX lines)` and `[+ Expand]`.
- **Expanded Widget**: Unconstrained height, thin blue border `1px solid #0088cc`, sharp square edges (`0px`), top header showing `[− Collapse]`.
- **1-Tap Inbox Button**: `[📥 Send to Inbox]` on widget header transmits code to Luno Inbox without clipboard copying.
- **1-Tap Outbox Banner**: `[📋 Fill Prompt Field]` on AI Studio inserts Luno prompt package directly into AI Studio input box with synthetic Angular/Lit DOM events.