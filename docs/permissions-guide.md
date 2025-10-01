# Permissions Guide

## Table of Contents

- [Overview](#overview)
- [Concepts](#concepts)
- [Requesting Permissions](#requesting-permissions)
- [Checking Permissions](#checking-permissions)
- [Managing Permissions](#managing-permissions)
- [Best Practices](#best-practices)
- [UI Patterns](#ui-patterns)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)

---

## Overview

**DIDComm permissions** determine which protocols and message types your app can use. They are enforced in the Service Worker and surfaced with helpers on the client.

---

## Concepts

### Permission Types

- **Protocol-level permissions** - Access to entire protocols
- **Message-type permissions** - Access to specific message types within protocols

### Permission Lifecycle

| Stage | Action | Method | Description |
|-------|--------|--------|-------------|
| **Request** | Ask for permission | `permissions.request()` | Present permission request to user |
| **Grant** | User approves | User action | User grants permission through UI |
| **Check** | Verify permission | `permissions.check()` | Check if permission is granted |
| **Use** | Invoke protocol | Protocol methods | Use the granted permission |
| **Revoke** | Remove permission | Host app policy | User or system revokes permission |
| **List** | View granted | `permissions.listGranted()` | List currently granted permissions |

### Persistence

> [!NOTE]
> Granted permissions persist across sessions where supported by the host environment.

---

## Requesting Permissions

### Permission Request Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `protocolUri` | `string` | Yes | URI of the protocol |
| `protocolName` | `string` | No | Human-readable protocol name |
| `description` | `string` | No | User-friendly description |
| `messageTypes` | `Array<{ typeUri: string; description?: string }>` | Yes | Array of message types to request |

### Example Request

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

---

## Checking Permissions

### Single Permission Check

```js
const ok = await sdk.permissions.check('https://didcomm.org/app-intent/1.0', 'https://didcomm.org/app-intent/1.0/share-request');
```

### Multiple Permission Check

```js
const results = await sdk.permissions.checkMultiple(
  ['https://didcomm.org/app-intent/1.0', 'https://didcomm.org/trust-ping/2.0'],
  ['https://didcomm.org/app-intent/1.0/share-request', 'https://didcomm.org/trust-ping/2.0/ping']
);
```

---

## Managing Permissions

### List Granted Permissions

```js
const granted = await sdk.permissions.listGranted(['https://didcomm.org/app-intent/1.0']);
```

### Revocation

> [!NOTE]
> Revocation patterns depend on host app policy. Not all environments support programmatic revocation.

---

## Best Practices

> [!IMPORTANT]
> Request least privilege; defer non-essential permissions until first use

> [!TIP]
> Provide clear, user-friendly descriptions that explain why the permission is needed

> [!WARNING]
> Handle permission denials gracefully and offer re-request flows

### 1. **Least Privilege Principle**
- Request only the permissions you need immediately
- Defer non-essential permissions until first use
- Group related permissions by feature area

### 2. **Clear Communication**
- Use descriptive protocol names and descriptions
- Explain what each permission enables
- Show the benefit to the user

### 3. **Graceful Handling**
- Handle denials without breaking the app
- Provide alternative flows when permissions are denied
- Offer re-request mechanisms

### 4. **Progressive Enhancement**
- Start with core functionality
- Add features that require additional permissions
- Make permission requests contextual

---

## UI Patterns

### Permission Prompts

> [!TIP]
> Show permission prompts explaining why and what for

**Good Permission Prompt:**
```
"Allow this app to send and receive messages with other apps?
This enables features like sharing content and receiving notifications."
```

**Bad Permission Prompt:**
```
"Grant permission to use DIDComm protocols"
```

### Settings UI

- Provide settings UI for viewing granted permissions
- Allow users to see what permissions are active
- Offer revocation options where supported

---

## Common Scenarios

| Scenario | Strategy | Example |
|----------|----------|---------|
| **First Launch** | Request core permissions only | Basic messaging, user profile |
| **Adding Features** | Request on first use | Share media when user clicks share |
| **Multi-Protocol Apps** | Group requests by feature areas | All messaging permissions together |
| **Progressive Web App** | Request as needed | Location permission when user enables location features |

---

## Troubleshooting

### Common Issues

**Permission checks return false:**
- Ensure the protocol/message type URI is correct
- Verify that permissions were actually granted
- Check that the Service Worker is running

**Permission requests fail:**
- Validate the request payload structure
- Ensure all required fields are present
- Check for typos in URIs

### Debugging

> [!TIP]
> For debugging, log permission request/response payloads in development builds

```js
// Development debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Permission request:', requests);
  console.log('Permission response:', res);
}
```
