Examples Index

This directory contains runnable examples demonstrating different parts of the SDK. All examples are plain static sites and require serving over HTTP(S) because Service Workers do not run from file:// URLs.

Prerequisites

- Node.js installed
- A simple static file server (for example: `npx http-server` or `npx serve`)

Build once (from repository root)

1. Install dependencies: `npm install`
2. Build the SDK: `npm run build`

How to run an example

1. Open a terminal and change into the example directory
2. Start a static server in that directory (e.g. `npx http-server -p 5173 .`)
3. Open `http://localhost:5173` in the browser

Notes

- The SDK targets the qikfox Browser.
- If you are developing the SDK locally, examples import from the published package path. Ensure you have built the repository so that `dist/` exists.

Examples

1) built-in-protocols/

- Demonstrates using built-in protocol helpers (e.g., Trust Ping, Discover Features, App Intents)
- Files: `index.html`, `app.js`
- Run: serve this folder and open the page; click buttons to invoke protocol methods

2) custom-protocol/

- Shows how to define and register a custom protocol in the Service Worker
- Files: `index.html`, `my-protocol.js`, `sw.js`
- Run: serve this folder; the `sw.js` registers built-in and custom protocol routing

3) framework-integration/

- Minimal examples for React and Vue integration
- Files: `react-example.jsx`, `vue-example.vue`
- Run: serve this folder; these are intentionally small snippets demonstrating usage patterns

4) protocol-helpers-showcase/

- Exercises the dynamic `sdk.protocols` helpers, including per-protocol methods and the `protocols.intents` facade
- Files: `index.html`, `app.js`, `sw.js`
- Run: serve this folder and use the UI buttons to try helpers

5) thread-based-messaging/

- Demonstrates thread-based delivery and waiting for responses
- Files: `index.html`, `app.js`, `sw.js`
- Run: serve this folder; the Service Worker is configured for thread-based delivery

6) vanilla-javascript/

- Smallest example showing initialization and a basic flow in plain JS
- Files: `index.html`, `app.js`
- Run: serve this folder and open the page


