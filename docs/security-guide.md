### Security Guide

Table of Contents

- Overview and Threat Model
- DIDComm Security
- Input Validation
- Permission Security
- Service Worker Security
- Client-Side Security
- Protocol Security
- Attachment Security
- Common Vulnerabilities
- Secure Development Practices
- Incident Response

Overview and Threat Model

- Boundaries: window (untrusted UI) vs Service Worker (routing/protocol runtime)
- Goals: message integrity, confidentiality (where applicable), least privilege

DIDComm Security

- Integrity and authentication are provided by pack/unpack implementations
- Respect message types and versions; reject unknown/invalid shapes

Input Validation

- Validate message type URIs and required fields
- Sanitize any user-provided strings used in UI
- Validate attachments (mime type, size, URL origin if external)

Permission Security

- Request only necessary permissions; scope to message types
- Log permission grants/denials in development; avoid excessive logs in production

Service Worker Security

- Avoid blocking the event loop; use `event.waitUntil` and async operations
- Guard against unbounded memory growth; prune caches/state
- Route messages securely; verify expected structure before dispatch
  - Message Router allowlist: by default, only allowlisted origins are accepted. For development, a browser flag can permit unlisted origins (see `qikfox://flags` → `#message-router-allow-unlisted-origins`). Use only temporarily and keep HTTPS.

Client-Side Security

- Prevent XSS with proper escaping and CSP
- Do not store secrets in client code; avoid long-lived tokens in storage

Protocol Security

- Prevent replay with thread IDs and timeouts
- Enforce message ordering where required by protocol design
- Use explicit timeouts and handle retries with backoff
 - Protocol registry enforcement: the browser permits only registered DIDComm protocol URIs by default. During development, enabling `qikfox://flags` → `#didcomm-allow-custom-protocols` allows testing custom (non-registered) protocols. Disable for production.

Attachment Security

- Enforce size limits; avoid rendering untrusted HTML
- For external URLs, validate schemes and consider allowlists

Common Vulnerabilities

- Unvalidated input leading to crashes or UI issues
- Overbroad permissions enabling

Secure Development Practices

- Review code paths that parse/handle messages
- Add tests for validation and error handling
- Keep dependencies updated; audit regularly

Incident Response

- Provide a way to report vulnerabilities
- Document emergency SW update procedures and revocation steps
