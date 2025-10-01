# Troubleshooting

## Overview

Use this guide to diagnose common setup and runtime issues with the Decent Application SDK.

---

## Quick Reference

| Symptom | Likely Cause | Solution | Section |
|---------|--------------|----------|---------|
| SDK not ready | Service Worker not registered | Check SW registration | [Service Worker Issues](#service-worker-issues) |
| Messages not received | Wrong delivery strategy | Check `deliveryStrategy` and `autoUnpack` | [Message Issues](#message-issues) |
| Protocol not found | Protocol not loaded | Run `protocols.refresh()` | [Protocol Issues](#protocol-issues) |
| Permission denied | Missing permissions | Request permissions first | [Permission Issues](#permission-issues) |
| Custom protocol blocked | Browser registry enforcement | Enable development flag | [Protocol Issues](#protocol-issues) |

---

## Before You Start

> [!TIP]
> Ensure the Service Worker is registered and controlling the page - this fixes 80% of common issues.

### Basic Checks

1. **Service Worker Status** - Check DevTools → Application → Service Workers
2. **HTTPS Requirement** - Required outside localhost
3. **Console Errors** - Look for error messages in browser console
4. **Network Tab** - Check for failed requests

---

## Installation Issues

### Module Not Found / ESM Errors

**Symptoms:**
- `Module not found` errors
- ESM import/export issues

**Solutions:**
- Ensure your bundler supports ESM
- Verify `decent_app_sdk` is installed
- Check import paths are correct

### Type Definitions

**Symptoms:**
- TypeScript errors
- Missing type information

**Solutions:**
- Ensure tooling picks up `src/types/*.d.ts` from package exports
- Check TypeScript configuration
- Verify package.json exports

---

## Service Worker Issues

### Not Registering

**Symptoms:**
- Service Worker not appearing in DevTools
- Registration errors in console

**Solutions:**
- Check path/scope: `navigator.serviceWorker.register('/sw.js')`
- Verify file exists and is accessible
- Check for CORS issues

### Not Activating/Controlling

**Symptoms:**
- Service Worker registered but not active
- Messages not being processed

**Solutions:**
- Wait for reload after first install
- Inspect SW in DevTools Application tab
- Check for errors in Service Worker console

### Scope Issues

**Symptoms:**
- Service Worker not controlling pages
- Messages not reaching Service Worker

**Solutions:**
- Ensure `sw.js` is served from higher or equal path to pages it should control
- Check Service Worker scope in DevTools

### HTTPS Requirement

> [!WARNING]
> HTTPS is required outside localhost for Service Workers.

---

## Initialization Issues

### SDK Not Ready / Timeout

**Symptoms:**
- `sdk.ready` never resolves
- Timeout errors

**Solutions:**
- Verify SW path matches `serviceWorkerUrl`
- Check console for errors
- Ensure Service Worker is active

### Multiple Initializations

**Symptoms:**
- Unexpected behavior
- Multiple SDK instances

**Solutions:**
- Create a single instance or use the provided singleton helper
- Use `getDecentClient()` instead of `new DecentClient()`

---

## Message Issues

### Not Receiving Messages

**Symptoms:**
- Messages sent but not received
- Silent failures

**Solutions:**
- Confirm `deliveryStrategy` and `autoUnpack` settings
- Add logging in Service Worker
- Check message routing

### Not Sending Messages

**Symptoms:**
- Send operations fail
- Pack errors

**Solutions:**
- Inspect `pack` and `send` results
- Check peer address and network/transport
- Verify message structure

### Thread ID Issues

**Symptoms:**
- Responses not correlated with requests
- Thread delivery not working

**Solutions:**
- Use `packed.thid` when available
- Ensure reply flows include proper `replyTo`
- Check thread delivery configuration

### Message Router Denial

**Symptoms:**
- Messages blocked by router
- Origin not allowed errors

**Solutions:**
- Your origin may not be in the allowlist
- For development, enable flag in `qikfox://flags`:
  - **Allow Unlisted Origins in Message Router** — `#message-router-allow-unlisted-origins`
- Use only in development; keep HTTPS and avoid dangerous schemes

---

## Protocol Issues

### Protocol Not Found

**Symptoms:**
- `protocols.list()` doesn't include expected protocol
- Method calls fail

**Solutions:**
- Run `await sdk.protocols.refresh()`
- Inspect `protocols.list()` output
- Check Service Worker registration

### Method Not Available

**Symptoms:**
- Method calls return "not found" errors
- Protocol exists but method missing

**Solutions:**
- Verify the protocol declares the method
- Check protocol is registered in Service Worker
- Ensure method name matches exactly

### Timeout Issues

**Symptoms:**
- Request/response timeouts
- Long delays

**Solutions:**
- Increase `timeoutMs`/`timeout` values
- Ensure providers respond within timeout
- Check network connectivity

### Custom Protocol Blocked

**Symptoms:**
- Custom protocols not working
- Permission denied for custom protocols

**Solutions:**
- Browser only permits registered DIDComm protocols by default
- For development, enable flag in `qikfox://flags`:
  - **Allow Custom DIDComm Protocols** — `#didcomm-allow-custom-protocols`
- When enabled, permission prompts and message packing can proceed for non-registered protocols

---

## Permission Issues

### Requests Failing

**Symptoms:**
- Permission requests return errors
- UI prompts not appearing

**Solutions:**
- Validate request payload structure
- Confirm UI prompts and user actions
- Check permission request format

### Checks Return False

**Symptoms:**
- `permissions.check()` returns false
- Access denied errors

**Solutions:**
- Ensure permissions were granted
- Verify URIs match exactly
- Check permission scope

---

## Performance Issues

### Slow Processing

**Symptoms:**
- Delayed message processing
- UI freezing

**Solutions:**
- Avoid heavy work on Service Worker main event
- Use async operations and `event.waitUntil`
- Move heavy processing to client side

### Memory Leaks

**Symptoms:**
- Increasing memory usage
- Browser slowdown

**Solutions:**
- Unsubscribe message listeners
- Prune caches and state regularly
- Clean up event handlers

---

## Debugging Techniques

### Debugging Tools

| Technique | Tool/Method | What to Look For | When to Use |
|-----------|-------------|------------------|-------------|
| **Console Logging** | `console.log` in SW and client | Error messages, flow traces | Development debugging |
| **DevTools Application** | Service Worker inspection | SW status, errors, storage | SW issues |
| **Network Tab** | Message traffic monitoring | Request/response patterns | Message flow issues |
| **Performance Tab** | Memory and CPU profiling | Performance bottlenecks | Performance issues |

### Debug Logging

> [!TIP]
> Enable debug logs in development; add targeted `console.log` in Service Worker and client.

```js
// Development debugging
if (process.env.NODE_ENV === 'development') {
  console.log('SDK operation:', operation, result);
}
```

---

## Error Messages

### Structured Results

- **Read `error` fields** from structured results
- **Use `getLastError(result)` helpers** for error information
- **Check success flags** before processing results

### Common Error Patterns

```js
// Check for errors in structured results
const result = await sdk.pack(dest, type, body);
if (!result.success) {
  console.error('Pack failed:', result.error);
  return;
}
```

---

## Browser-Specific Issues

### Service Worker Support

- **Verify SW feature availability** in target browsers
- **Some mobile browsers** limit background SW execution
- **Check browser compatibility** for Service Worker features

---

## Environment Issues

### Localhost vs Production

**Common Issues:**
- Incorrect Service Worker path and scope
- CORS configuration
- HTTPS requirements

**Solutions:**
- Ensure correct SW path and scope
- Configure CORS where needed
- Use HTTPS in production

---

## Browser Flags Reference

| Flag | Flag ID | Purpose | Use Case | Warning |
|------|---------|---------|----------|---------|
| **Allow Unlisted Origins in Message Router** | `#message-router-allow-unlisted-origins` | Bypass origin allowlist | Development only | **Never use in production** |
| **Allow Custom DIDComm Protocols** | `#didcomm-allow-custom-protocols` | Enable custom protocols | Development only | **Never use in production** |

> [!WARNING]
> Browser flags are for development only. Always revert flags before shipping to production.

---

## Getting Help

### Before Reporting Issues

1. **Check this troubleshooting guide**
2. **Enable debug logging**
3. **Collect relevant information**

### Information to Include

> [!TIP]
> When reporting issues, include steps to reproduce, logs, and environment details.

**Required Information:**
- Steps to reproduce the issue
- Browser and version
- Console logs and errors
- Service Worker status
- Network requests (if relevant)
- Environment (localhost/production)

**Optional Information:**
- Screenshots of DevTools
- Code snippets
- Expected vs actual behavior


