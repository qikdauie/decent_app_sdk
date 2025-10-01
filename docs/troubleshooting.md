### Troubleshooting

Overview

Use this guide to diagnose common setup and runtime issues.

Table of Contents

- Installation Issues
- Service Worker Issues
- Initialization Issues
- Message Issues
- Protocol Issues
- Permission Issues
- Performance Issues
- Debugging Techniques
- Error Messages
- Browser-Specific Issues
- Environment Issues
- Getting Help

Installation Issues

- Module not found / ESM errors: ensure your bundler supports ESM and that `decent_app_sdk` is installed.
- Type definitions: make sure your tooling picks up `src/types/*.d.ts` from package exports.

Service Worker Issues

- Not registering: check path/scope; register via `navigator.serviceWorker.register('/sw.js')`.
- Not activating/controlling: wait for reload after first install; inspect SW in DevTools.
- Scope issues: ensure `sw.js` is served from a higher or equal path to pages it should control.
- HTTPS: required outside localhost.

Initialization Issues

- SDK not ready / timeout: verify SW path matches `serviceWorkerUrl`; check console for errors.
- Multiple initializations: create a single instance or use the provided singleton helper.

Message Issues

- Not receiving: confirm `deliveryStrategy` and `autoUnpack` settings; add logging in SW.
- Not sending: inspect `pack` and `send` results; check peer address and network/transport.
- Thread ID issues: use `packed.thid` when available; ensure reply flows include proper `replyTo`.
- Denied by Message Router: your origin may not be in the allowlist. For development, you can enable the flag in `qikfox://flags` to bypass the router allowlist:
  - Allow Unlisted Origins in Message Router — `#message-router-allow-unlisted-origins`
  Use only in development; keep HTTPS and avoid dangerous schemes.

Protocol Issues

- Not found: run `await sdk.protocols.refresh()` and inspect `list()`.
- Method not available: verify the protocol declares the method and is registered in SW.
- Timeout: increase `timeoutMs`/`timeout` and ensure providers respond.
- Unknown protocol denied: the browser only permits registered DIDComm protocols by default. For development, enable the flag in `qikfox://flags`:
  - Allow Custom DIDComm Protocols — `#didcomm-allow-custom-protocols`
  When enabled, permission prompts and message packing can proceed for non-registered protocols.

Permission Issues

- Requests failing: validate request payload; confirm UI prompts and user actions.
- Checks false: ensure permissions were granted and URIs match.

Performance Issues

- Slow processing: avoid heavy work on SW main event; use async and `waitUntil`.
- Memory leaks: unsubscribe listeners and prune state.

Debugging Techniques

- Enable debug logs in development; add targeted `console.log` in SW and client.
- Use DevTools Application tab for SW inspection; Network tab for message traffic.

Error Messages

- Read `error` fields from structured results; use `getLastError(result)` helpers.

Browser-Specific Issues

- Verify SW feature availability; some mobile browsers limit background SW execution.

Environment Issues

- Localhost vs production: ensure correct SW path and scope; configure CORS where needed.

Getting Help

- File an issue with steps to reproduce, logs, and environment details.


