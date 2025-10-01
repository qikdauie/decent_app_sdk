# Built-in Protocols

## Table of Contents

- [Overview](#overview)
- [Discover-Features 2.0](#discover-features-20)
- [App-Intents 1.0](#app-intents-10)
- [Trust-Ping 2.0](#trust-ping-20)
- [Basic Message 2.0](#basic-message-20)
- [User Profile 1.0](#user-profile-10)
- [Out-of-Band 2.0](#out-of-band-20)
- [Report Problem 2.0](#report-problem-20)
- [Share Media 1.0](#share-media-10)
- [Protocol Comparison](#protocol-comparison)
- [Common Patterns](#common-patterns)

---

## Overview

Built-in protocols are enabled by `initServiceWorker({ builtInProtocols: true })`. You can disable specific protocols or add your own. Versions follow DIDComm RFCs where applicable.

> [!NOTE]
> You can enable or disable specific protocols by passing a configuration object instead of `true`. For example: `{ builtInProtocols: { 'trust-ping-v2': true, 'basic-message-v2': false } }`

---

## Discover-Features 2.0

**Discover-Features** enables feature discovery across protocol and intent spaces.

### Message Types
- `https://didcomm.org/discover-features/2.0/queries`
- `https://didcomm.org/discover-features/2.0/disclose`

### Use Cases
- Feature discovery across protocol and intent spaces
- Capability negotiation between peers

### Helpers
- `sdk.protocols.discover(['*'])`

---

## App-Intents 1.0

**App-Intents** enables cross-application intent-based communication.

### Message Types
- Request/Response: `.../<action>-request`, `.../<action>-response`
- Signals: decline/progress/cancel

### Helpers
- `sdk.protocols.intents.advertise`
- `sdk.protocols.intents.discover`
- `sdk.protocols.intents.request`

---

## Trust-Ping 2.0

**Trust-Ping** provides liveness testing and latency measurement capabilities.

### Message Types
- `https://didcomm.org/trust-ping/2.0/ping`
- `https://didcomm.org/trust-ping/2.0/ping-response`

### Purpose
Liveness testing and latency measurement

### Client Methods
- `sdk.protocols['trust-ping-v2'].ping(to, options?)`
- `sdk.protocols['trust-ping-v2'].pingAndWait(to, options?)`

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `comment` | `string` | `undefined` | Optional comment to include with ping |
| `responseRequested` | `boolean` | `true` | Whether to request a response |
| `timeoutMs` | `number` | `5000` | Timeout for ping operations |

### Configuration (Service Worker)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoRespond` | `boolean` | `true` | Automatically respond to ping requests |
| `defaultTimeoutMs` | `number` | `5000` | Default timeout for ping operations |

### Examples

**Simple ping:**
```js
await sdk.protocols['trust-ping-v2'].ping('did:example:peer', { comment: 'hello' });
```

**Ping with response:**
```js
const res = await sdk.protocols['trust-ping-v2'].pingAndWait('did:example:peer', { timeoutMs: 3000 });
console.log(res);
```

---

## Basic Message 2.0

**Basic Message** provides simple text-based messaging capabilities.

### Message Type
- `https://didcomm.org/basicmessage/2.0/message`

### Methods
- `sendMessage(to, content)`
- `getMessages()`

> [!NOTE]
> Follows DIDComm Basic Message 2.0 specification

---

## User Profile 1.0

**User Profile** enables sharing and requesting user profile information.

### Message Types
- `https://didcomm.org/user-profile/1.0/profile`
- `https://didcomm.org/user-profile/1.0/request-profile`

### Methods
- `sendProfile`
- `requestProfile`
- `getProfile`

---

## Out-of-Band 2.0

**Out-of-Band** enables creating and parsing connection invitations.

### Message Type
- `https://didcomm.org/out-of-band/2.0/invitation`

### Methods
- `createInvitation`
- `parseInvitation`
- `encodeInvitationUrl`

---

## Report Problem 2.0

**Report Problem** enables reporting and handling error conditions.

### Message Type
- `https://didcomm.org/report-problem/2.0/problem-report`

### Methods
- `sendProblemReport`
- `getProblemReports`

---

## Share Media 1.0

**Share Media** enables sharing and requesting media files and documents.

### Message Types
- `https://didcomm.org/share-media/1.0/share`
- `https://didcomm.org/share-media/1.0/request`

### Methods
- `shareMedia`
- `requestMedia`
- `getSharedMedia`

> [!TIP]
> Canonical attachments are recommended for media sharing (see API Reference: Attachments)

---

## Protocol Comparison

| Protocol | Version | Pattern | Primary Use Case | Key Methods |
|----------|---------|---------|------------------|-------------|
| **Discover-Features** | 2.0 | Discovery | Feature discovery | `discover()` |
| **App-Intents** | 1.0 | Request/Response | Cross-app communication | `advertise()`, `discover()`, `request()` |
| **Trust-Ping** | 2.0 | Request/Response | Liveness testing | `ping()`, `pingAndWait()` |
| **Basic Message** | 2.0 | Notification | Simple messaging | `sendMessage()`, `getMessages()` |
| **User Profile** | 1.0 | Request/Response | Profile sharing | `sendProfile()`, `requestProfile()`, `getProfile()` |
| **Out-of-Band** | 2.0 | Request/Response | Connection invitations | `createInvitation()`, `parseInvitation()` |
| **Report Problem** | 2.0 | Request/Response | Error reporting | `sendProblemReport()`, `getProblemReports()` |
| **Share Media** | 1.0 | Request/Response | Media sharing | `shareMedia()`, `requestMedia()`, `getSharedMedia()` |

---

## Common Patterns

> [!TIP]
> Use Discover-Features to check availability before invoking protocol methods

> [!TIP]
> Prefer canonical attachments in media/profile payloads for better compatibility

> [!TIP]
> Use `timeoutMs` for request/response style protocols to handle user action delays gracefully
