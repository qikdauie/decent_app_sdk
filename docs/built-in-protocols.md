### Built-in Protocols

#### Discover-Features 2.0
- Queries: `https://didcomm.org/discover-features/2.0/queries`
- Disclose: `https://didcomm.org/discover-features/2.0/disclose`

Helper: `protocols.discover(['message-type:*'])`

#### App-Intents 1.0
- Request types: `https://didcomm.org/app-intent/1.0/<action>-request`
- Response types: `https://didcomm.org/app-intent/1.0/<action>-response`
- Signals: decline/progress/cancel

Helpers: `protocols.intents.advertise`, `protocols.intents.discover`, `protocols.intents.request`


#### Basic Message 1.0
- Type: `https://didcomm.org/basicmessage/1.0/message`

Client methods:
- `sdk.protocols['basic-message-v1'].sendMessage(to, content, options?)`
- `sdk.protocols['basic-message-v1'].getMessages()`

Example:
```js
await sdk.protocols['basic-message-v1'].sendMessage('did:example:peer', 'Hello world');
const inbox = await sdk.protocols['basic-message-v1'].getMessages();
```

#### User Profile 1.0
- Types: `https://didcomm.org/user-profile/1.0/profile`, `https://didcomm.org/user-profile/1.0/request-profile`

Client methods:
- `sdk.protocols['user-profile-v1'].sendProfile(to, { displayName, description, displayPicture? }, { send_back_yours? })`
- `sdk.protocols['user-profile-v1'].requestProfile(to, { query?, send_back_yours?, timeoutMs? })`
- `sdk.protocols['user-profile-v1'].getProfile(peer)`

#### Out-of-Band 2.0
- Type: `https://didcomm.org/out-of-band/2.0/invitation`

Client methods:
- `sdk.protocols['out-of-band-v2'].createInvitation(options?) // { invitation, url }`
- `sdk.protocols['out-of-band-v2'].parseInvitation(input)`
- `sdk.protocols['out-of-band-v2'].encodeInvitationUrl(invitation, options?)`

#### Report Problem 2.0
- Type: `https://didcomm.org/report-problem/2.0/problem-report`

Client methods:
- `sdk.protocols['report-problem-v2'].sendProblemReport(to, { problemCode, explain?, args?, escalate_to?, web_redirect? })`
- `sdk.protocols['report-problem-v2'].getProblemReports()`

#### Share Media 1.0
- Types: `https://didcomm.org/share-media/1.0/share`, `https://didcomm.org/share-media/1.0/request`

Client methods:
- `sdk.protocols['share-media-v1'].shareMedia(to, media, { note?, sizeLimit? })`
- `sdk.protocols['share-media-v1'].requestMedia(to, { query?, timeoutMs? })`
- `sdk.protocols['share-media-v1'].getSharedMedia()`

Canonical attachment format examples for Share Media:

```js
// Embedded data
await sdk.protocols['share-media-v1'].shareMedia(to, {
  mimeType: 'image/jpeg',
  filename: 'photo.jpg',
  data: 'base64...'
});

// External URL
await sdk.protocols['share-media-v1'].shareMedia(to, {
  mimeType: 'image/jpeg',
  filename: 'photo.jpg',
  externalUrl: 'https://example.org/img.jpg'
});

// Legacy shape (still supported):
// { mime_type: 'image/jpeg', filename: 'photo.jpg', data: { base64: '...' } }
```

User Profile display pictures are handled as attachments with `id: 'display-picture'` in canonical format. Attachments are carried at top-level; the protocol helper marks them in the body for lifting.

Out-of-Band invitations encode attachments using the same canonical format when present in the invitation payload.


