# Security Guide

## Table of Contents

- [Overview and Threat Model](#overview-and-threat-model)
- [DIDComm Security](#didcomm-security)
- [Input Validation](#input-validation)
- [Permission Security](#permission-security)
- [Service Worker Security](#service-worker-security)
- [Client-Side Security](#client-side-security)
- [Protocol Security](#protocol-security)
- [Attachment Security](#attachment-security)
- [Common Vulnerabilities](#common-vulnerabilities)
- [Secure Development Practices](#secure-development-practices)
- [Incident Response](#incident-response)

---

## Overview and Threat Model

### Security Boundaries

| Boundary | Trust Level | Threats | Mitigations |
|----------|-------------|---------|-------------|
| **Window/UI** | Untrusted | XSS, malicious input, UI manipulation | Input validation, CSP, escaping |
| **Service Worker** | Trusted | Message routing attacks, memory leaks | Message validation, resource limits |
| **Message Transport** | Untrusted | Interception, tampering, replay | DIDComm encryption, thread IDs |
| **Protocol Layer** | Trusted | Protocol abuse, unauthorized access | Permission checks, input validation |

### Security Goals

- **Message integrity** - Ensure messages haven't been tampered with
- **Confidentiality** - Protect sensitive data where applicable
- **Least privilege** - Grant only necessary permissions

> [!WARNING]
> Security is a shared responsibility between the SDK, your application, and the host environment.

---

## DIDComm Security

### Message Security

- **Integrity and authentication** are provided by `pack`/`unpack` implementations
- **Respect message types and versions** - reject unknown/invalid shapes
- **Validate message structure** before processing

### Best Practices

```js
// ✅ Good: Validate message type
if (message.type !== 'https://didcomm.org/trust-ping/2.0/ping') {
  throw new Error('Invalid message type');
}

// ❌ Bad: Accept any message type
processMessage(message);
```

---

## Input Validation

### Message Validation

| Check | Priority | Implementation |
|-------|----------|----------------|
| **Message type URIs** | 🔴 Critical | Validate against expected types |
| **Required fields** | 🔴 Critical | Check all mandatory fields present |
| **Field types** | 🟠 High | Ensure correct data types |
| **String length** | 🟡 Medium | Limit string lengths |
| **Numeric ranges** | 🟡 Medium | Validate number ranges |

### User Input Sanitization

- **Sanitize user-provided strings** used in UI
- **Escape HTML content** to prevent XSS
- **Validate file uploads** before processing

### Attachment Validation

| Field | Validation | Priority |
|-------|------------|----------|
| **MIME type** | Check against allowlist | 🔴 Critical |
| **File size** | Enforce limits | 🔴 Critical |
| **External URLs** | Validate schemes and origins | 🟠 High |
| **File content** | Scan for malicious content | 🟡 Medium |

---

## Permission Security

### Permission Best Practices

> [!IMPORTANT]
> Request only necessary permissions; scope to specific message types

### Permission Checklist

| Category | Check | Priority | Reference |
|----------|-------|----------|-----------|
| **Input Validation** | Validate all message inputs | 🔴 Critical | [Input Validation](#input-validation) |
| **Permissions** | Request least privilege | 🔴 Critical | [Permission Security](#permission-security) |
| **Service Worker** | Use `event.waitUntil` | 🟠 High | [Service Worker Security](#service-worker-security) |
| **Client-Side** | Prevent XSS | 🔴 Critical | [Client-Side Security](#client-side-security) |
| **Protocol** | Use thread IDs and timeouts | 🟠 High | [Protocol Security](#protocol-security) |
| **Attachments** | Enforce size limits | 🟠 High | [Attachment Security](#attachment-security) |

### Logging

- **Log permission grants/denials** in development
- **Avoid excessive logs** in production
- **Use structured logging** for security events

---

## Service Worker Security

### Event Loop Management

- **Avoid blocking the event loop** - use `event.waitUntil` and async operations
- **Guard against unbounded memory growth** - prune caches/state regularly
- **Route messages securely** - verify expected structure before dispatch

### Message Router Security

> [!IMPORTANT]
> Message Router allowlist: by default, only allowlisted origins are accepted. For development, a browser flag can permit unlisted origins (see `qikfox://flags` → `#message-router-allow-unlisted-origins`). Use only temporarily and keep HTTPS.

### Resource Management

```js
// ✅ Good: Use event.waitUntil for async operations
event.waitUntil(processMessage(message));

// ❌ Bad: Blocking synchronous operation
processMessage(message); // Blocks event loop
```

---

## Client-Side Security

### XSS Prevention

- **Prevent XSS** with proper escaping and CSP
- **Do not store secrets** in client code
- **Avoid long-lived tokens** in storage

### Content Security Policy

```html
<!-- Example CSP header -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
">
```

> [!TIP]
> Use CSP headers to prevent XSS attacks and unauthorized script execution.

---

## Protocol Security

### Replay Prevention

- **Prevent replay** with thread IDs and timeouts
- **Enforce message ordering** where required by protocol design
- **Use explicit timeouts** and handle retries with backoff

### Protocol Registry

> [!WARNING]
> Protocol registry enforcement: the browser permits only registered DIDComm protocol URIs by default. During development, enabling `qikfox://flags` → `#didcomm-allow-custom-protocols` allows testing custom (non-registered) protocols. **Disable for production.**

### Development Flags

| Flag | Flag ID | Purpose | Use Case | Warning |
|------|---------|---------|----------|---------|
| Allow Unlisted Origins in Message Router | `#message-router-allow-unlisted-origins` | Bypass origin allowlist | Development only | **Never use in production** |
| Allow Custom DIDComm Protocols | `#didcomm-allow-custom-protocols` | Enable custom protocols | Development only | **Never use in production** |

---

## Attachment Security

### Size Limits

- **Enforce size limits** - prevent memory exhaustion
- **Avoid rendering untrusted HTML** - sanitize content
- **Validate external URLs** - check schemes and consider allowlists

### File Validation

```js
// ✅ Good: Validate attachment
function validateAttachment(attachment) {
  if (attachment.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  if (!ALLOWED_MIME_TYPES.includes(attachment.mimeType)) {
    throw new Error('Invalid file type');
  }
  
  if (attachment.externalUrl) {
    const url = new URL(attachment.externalUrl);
    if (!ALLOWED_ORIGINS.includes(url.origin)) {
      throw new Error('Invalid external URL');
    }
  }
}
```

---

## Common Vulnerabilities

| Vulnerability | Impact | Mitigation | Severity |
|---------------|--------|------------|----------|
| **Unvalidated input** | Crashes, UI issues | Input validation | 🔴 Critical |
| **Overbroad permissions** | Unauthorized access | Least privilege | 🔴 Critical |
| **XSS** | Code execution | CSP, escaping | 🔴 Critical |
| **Replay attacks** | Unauthorized actions | Thread IDs, timeouts | 🟠 High |
| **Unbounded memory growth** | DoS | Resource limits | 🟠 High |
| **Insecure external URLs** | Data leakage | URL validation | 🟡 Medium |

---

## Secure Development Practices

### Code Review Checklist

1. **Review code paths** that parse/handle messages
2. **Add tests** for validation and error handling
3. **Keep dependencies updated** - audit regularly
4. **Use secure coding practices** - avoid common pitfalls
5. **Implement proper error handling** - don't expose sensitive information

### Testing

```js
// Example security test
describe('Message Validation', () => {
  test('should reject invalid message types', () => {
    const invalidMessage = {
      type: 'https://malicious.org/attack',
      body: { malicious: 'payload' }
    };
    
    expect(() => validateMessage(invalidMessage)).toThrow('Invalid message type');
  });
});
```

---

## Incident Response

### Vulnerability Reporting

- **Provide a way** to report vulnerabilities
- **Document emergency procedures** for SW updates
- **Have revocation steps** ready

### Emergency Procedures

1. **Immediate response** - Disable affected features
2. **Investigation** - Determine scope and impact
3. **Fix deployment** - Deploy security patches
4. **Communication** - Notify affected users
5. **Post-incident** - Review and improve security measures

> [!IMPORTANT]
> Never store secrets in client code. Always assume the client environment is untrusted.
