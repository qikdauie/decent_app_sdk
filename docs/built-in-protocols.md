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


