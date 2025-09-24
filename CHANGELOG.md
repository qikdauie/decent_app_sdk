# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [0.1.0] - 2025-09-24
### Added
- Initial public release of the Decent Application SDK.
- Browser-first client (`DecentApp`) with helper APIs and response utilities.
- Service Worker initialization (`initServiceWorker`) with RPC routing and delivery strategies.
- Pluggable protocol framework with built-in Discover Features and App Intents protocols.
- Protocol and permission helper APIs.
- TypeScript definitions for client, protocols, and helpers.
- Documentation: README and API reference updates.

### Notes
- This release is ready for integration testing.
- App-intents `requestType` must be provided until `packMessage` exposes threadId.

[0.1.0]: https://example.com/releases/0.1.0

