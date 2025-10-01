### Permissions Guide

Table of Contents

- Overview
- Concepts
- Requesting Permissions
- Checking Permissions
- Managing Permissions
- Best Practices
- UI Patterns
- Common Scenarios
- Troubleshooting

Overview

DIDComm permissions determine which protocols and message types your app can use. They are enforced in the Service Worker and surfaced with helpers on the client.

Concepts

- Protocol-level and message-type permissions
- Lifecycle: request → grant → use → revoke
- Persistence: granted permissions persist across sessions where supported

Requesting Permissions

```js
const requests = [{
  protocolUri: 'https://didcomm.org/app-intent/1.0',
  protocolName: 'App Intents',
  description: 'Allow cross-app intent requests',
  messageTypes: [
    { typeUri: 'https://didcomm.org/app-intent/1.0/share-request', description: 'Share content' },
  ],
}];

const res = await sdk.permissions.request(requests);
if (!res?.ok) throw new Error('Permission request failed');
```

Checking Permissions

```js
const ok = await sdk.permissions.check('https://didcomm.org/app-intent/1.0', 'https://didcomm.org/app-intent/1.0/share-request');
```

Managing Permissions

- List granted: `await sdk.permissions.listGranted(['https://didcomm.org/app-intent/1.0'])`
- Revocation patterns depend on host app policy (not all environments support revoke)

Best Practices

- Request least privilege; defer non-essential permissions
- Provide clear, user-friendly descriptions
- Handle denials gracefully and offer re-request flows

UI Patterns

- Show permission prompts explaining why and what for
- Provide settings UI for viewing granted permissions

Common Scenarios

- First launch: request core permissions only
- Adding features: request on first use
- Multi-protocol apps: group requests by feature areas

Troubleshooting

- If checks return false, ensure the protocol/message type is correct and that permissions were granted
- For debugging, log permission request/response payloads in development builds
