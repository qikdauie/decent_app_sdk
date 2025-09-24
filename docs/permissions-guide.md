### Permissions Guide

Request example:

```js
const requests = [{
  protocolUri: 'https://didcomm.org/app-intent/1.0',
  protocolName: 'App Intents',
  description: 'Allow cross-app intent requests',
  messageTypes: [{ typeUri: 'https://didcomm.org/app-intent/1.0/share-request', description: 'Share content' }],
}];
const res = await sdk.permissions.request(requests);
```


