### Built-in Protocols

Table of Contents

- Overview
- Discover-Features 2.0
- App-Intents 1.0
- Trust-Ping 2.0
- Basic Message 2.0
- User Profile 1.0
- Out-of-Band 2.0
- Report Problem 2.0
- Share Media 1.0
- Protocol Comparison
- Common Patterns

Overview

Built-in protocols are enabled by `initServiceWorker({ builtInProtocols: true })`. You can disable specific protocols or add your own. Versions follow DIDComm RFCs where applicable.

Discover-Features 2.0

- Types: `https://didcomm.org/discover-features/2.0/queries`, `https://didcomm.org/discover-features/2.0/disclose`
- Use cases: feature discovery across protocol and intent spaces
- Helpers: `sdk.protocols.discover(['*'])`

App-Intents 1.0

- Request/Response: `.../<action>-request`, `.../<action>-response`; signals include decline/progress/cancel
- Helpers: `sdk.protocols.intents.advertise`, `sdk.protocols.intents.discover`, `sdk.protocols.intents.request`

Trust-Ping 2.0

- Message types: `https://didcomm.org/trust-ping/2.0/ping`, `https://didcomm.org/trust-ping/2.0/ping-response`
- Purpose: Liveness testing and latency measurement
- Client methods:
  - `sdk.protocols['trust-ping-v2'].ping(to, options?)`
  - `sdk.protocols['trust-ping-v2'].pingAndWait(to, options?)`
- Options: `{ comment?: string, responseRequested?: boolean, timeoutMs?: number }`
- Configuration (SW): `{ autoRespond?: boolean, defaultTimeoutMs?: number }`

Examples

```js
await sdk.protocols['trust-ping-v2'].ping('did:example:peer', { comment: 'hello' });

const res = await sdk.protocols['trust-ping-v2'].pingAndWait('did:example:peer', { timeoutMs: 3000 });
console.log(res);
```

Basic Message 2.0

- Type: `https://didcomm.org/basicmessage/2.0/message`
- Methods: `sendMessage(to, content)`, `getMessages()`
  - Follows DIDComm Basic Message 2.0 specification

User Profile 1.0

- Types: `https://didcomm.org/user-profile/1.0/profile`, `https://didcomm.org/user-profile/1.0/request-profile`
- Methods: `sendProfile`, `requestProfile`, `getProfile`

Out-of-Band 2.0

- Type: `https://didcomm.org/out-of-band/2.0/invitation`
- Methods: `createInvitation`, `parseInvitation`, `encodeInvitationUrl`

Report Problem 2.0

- Type: `https://didcomm.org/report-problem/2.0/problem-report`
- Methods: `sendProblemReport`, `getProblemReports`

Share Media 1.0

- Types: `https://didcomm.org/share-media/1.0/share`, `https://didcomm.org/share-media/1.0/request`
- Methods: `shareMedia`, `requestMedia`, `getSharedMedia`
- Canonical attachments are recommended (see API Reference: Attachments)

Protocol Comparison (high level)

- Request/Response: App-Intents, Trust-Ping, User Profile, Report Problem, Out-of-Band (parse)
- Notification: Basic Message, Share Media (share)
- Discovery: Discover-Features, App-Intents discovery

Common Patterns

- Use Discover-Features to check availability before invoking methods
- Prefer canonical attachments in media/profile payloads
- Use `timeoutMs` for request/response style protocols
