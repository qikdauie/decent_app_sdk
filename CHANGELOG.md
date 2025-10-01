# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [0.1.0] - 2025-09-24
### Added
- Initial public release of the Decent Application SDK.
- Browser-first client (`DecentClient`) with helper APIs and response utilities.
- Service Worker initialization (`initServiceWorker`) with RPC routing and delivery strategies.
- Pluggable protocol framework with built-in protocols:
  - Discover Features 2.0
  - App Intents 1.0
  - Trust Ping 2.0
  - Basic Message 2.0
  - User Profile 1.0
  - Out-of-Band 2.0
  - Report Problem 2.0
  - Share Media 1.0
- Protocol and permission helper APIs.
- TypeScript definitions for client, protocols, and helpers.
- Documentation: README and API reference updates.

### Notes
- This release is ready for integration testing.
- When available, `packMessage` returns a `thid` (thread id) for correlating requests and responses.
- Supports broadcast and thread-based delivery strategies.
- Canonical attachment handling across protocols with legacy compatibility.
- Dynamic protocol registration and singleton helpers available.

### Known Limitations
- Service Worker required; HTTPS recommended (required outside localhost).
- Protocol interoperability depends on both peers supporting the same versions.

### Migration Guide
- If you relied on the absence of `thid` from `packMessage`, note that `thid` may now be present and used by routing helpers.

[0.1.0]: https://example.com/releases/0.1.0

