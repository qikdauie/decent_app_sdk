### Security Guide

- Validate message shape and types before handling
- Prefer minimal capabilities and least privilege with permissions
- Avoid blocking the Service Worker event loop; use waitUntil for async
- Never trust client-provided UI inputs without validation


