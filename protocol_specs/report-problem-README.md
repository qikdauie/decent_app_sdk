§

Problem Reports

DIDComm features a standard mechanism for reporting problems to other entities. These could be parties in the active protocol, or logging products, or internal health monitors, or human tech support staff. Reporting problems remotely is not always possible (e.g., when a sender lacks a route to the other party, or when a recipient’s crypto is incompatible with a sender’s). Using this mechanism is therefore not a general requirement of DIDComm, but it is a best practice because it improves robustness and human experience. (But be aware of some cybersecurity considerations.)



Other entities are notified of problems by sending a simple message called a problem report that looks like this:



{

&nbsp; "type": "https://didcomm.org/report-problem/2.0/problem-report",

&nbsp; "id": "7c9de639-c51c-4d60-ab95-103fa613c805",

&nbsp; "pthid": "1e513ad4-48c9-444e-9e7e-5b8b45c5e325",

&nbsp; "ack": \["1e513ad4-48c9-444e-9e7e-5b8b45c5e325"],

&nbsp; "body": {

&nbsp;   "code": "e.p.xfer.cant-use-endpoint",

&nbsp;   "comment": "Unable to use the {1} endpoint for {2}.",

&nbsp;   "args": \[

&nbsp;     "https://agents.r.us/inbox",

&nbsp;     "did:sov:C805sNYhMrjHiqZDTUASHg"

&nbsp;   ],

&nbsp;   "escalate\_to": "mailto:admin@foo.org"

&nbsp; }

}

pthid - REQUIRED. The value is the thid of the thread in which the problem occurred. (Thus, the problem report begins a new child thread, of which the triggering context is the parent. The parent context can react immediately to the problem, or can suspend progress while troubleshooting occurs.)



ack - OPTIONAL. It SHOULD be included if the problem in question was triggered directly by a preceding message. (Contrast problems arising from a timeout or a user deciding to cancel a transaction, which can arise independent of a preceding message. In such cases, ack MAY still be used, but there is no strong recommendation.)



code - REQUIRED. Deserves a rich explanation; see Problem Codes below.



comment - OPTIONAL but recommended. Contains human-friendly text describing the problem. If the field is present, the text MUST be statically associated with code, meaning that each time circumstances trigger a problem with the same code, the value of comment will be the same. This enables localization and cached lookups, and it has some cybersecurity benefits. The value of comment supports simple interpolation with args (see next), where args are referenced as {1}, {2}, and so forth.



args - OPTIONAL. Contains situation-specific values that are interpolated into the value of comment, providing extra detail for human readers. Each unique problem code has a definition for the args it takes. In this example, e.p.xfer.cant-use-endpoint apparently expects two values in args: the first is a URL and the second is a DID. Missing or null args MUST be replaced with a question mark character (?) during interpolation; extra args MUST be appended to the main text as comma-separated values.



escalate\_to - OPTIONAL. Provides a URI where additional help on the issue can be received.



§

Problem Codes

Perhaps the most important feature of each problem report message is its code field. This required value is the main piece of data that recipient software uses to automate reactions. It categorizes what went wrong.



Problem codes are lower kebab-case. They are structured as a sequence of tokens delimited by the dot character ., with the tokens being more general to the left, and more specific to the right. Because recipients can do matching by prefix instead of full string, a recipient can recognize and handle broad semantics even if the trailing tokens of the string contain unfamiliar details. In the example below, for example, relatively sophisticated handling is possible even if a recipient only recognizes the e.p.xfer. portion of the code.



problem code structure



§ Sorter

The leftmost component of a problem code is its sorter. This is a single character that tells whether the consequence of the problem are fully understood. Two values are defined:



e: This problem clearly defeats the intentions of at least one of the parties. It is therefore an error. A situation with error semantics might be that a protocol requires payment, but a payment attempt was rejected.

w: The consequences of this problem are not obvious to the reporter; evaluating its effects requires judgment from a human or from some other party or system. Thus, the message constitutes a warning from the sender’s perspective. A situation with warning semantics might be that a sender is only able to encrypt a message for some of the recipient’s keyAgreement keys instead of all of them (perhaps due to an imperfect overlap of supported crypto types). The sender in such a situation might not know whether the recipient considers this an error.

Note: What distinguishes an error from a warning is clarity about its consequences, not its severity. This clarity is inherently contextual. A warning might prove to be just as problematic as an error, once it’s fully evaluated. This implies that the same problem can be an error in some contexts, and a warning in others. In our example above, we imagined a payment failure as an error. But if this problem occurs in a context where retries are expected, and there’s a good chance of future success, perhaps the problem is a warning the first three times it’s reported — then becomes an error when all hope is lost.



§ Scope

Reading left to right, the second token in a problem code is called the scope. This gives the sender’s opinion about how much context should be undone if the problem is deemed an error.



Note: A problem always sorts according to the most pessimistic view that is taken by participants in the protocol. If the sender of a problem report deems it an error, then it is. If the sender deems it a warning, but a recipient with greater context decides that it clearly frustrates their goals, then it becomes an error; see Replying to Warnings. Thus, scope is relevant even if the sender chooses a problem code that starts with w.)



The possible values of scope are:



p: The protocol within which the error occurs (and any co-protocols started by and depended on by the protocol) is abandoned or reset. In simple two-party request-response protocols, the p reset scope is common and appropriate. However, if a protocol is complex and long-lived, the p reset scope may be undesirable. Consider a situation where a protocol helps a person apply for college, and the problem code is e.p.payment-failed. With such a p reset scope, the entire apply-for-college workflow (collecting letters of recommendation, proving qualifications, filling out various forms) is abandoned when the payment fails. The p scope is probably too aggressive for such a situation.



m: The error was triggered by the previous message on the thread; the scope is one message. The outcome is that the problematic message is rejected (has no effect). If the protocol is a chess game, and the problem code is e.m.invalid-move, then someone’s invalid move is rejected, and it is still their turn.



A formal state name from the sender’s state machine in the active protocol. This means the error represented a partial failure of the protocol, but the protocol as a whole is not abandoned. Instead, the sender uses the scope to indicate what state it reverts to. If the protocol is one that helps a person apply for college, and the problem code is e.get-pay-details.payment-failed, then the sender is saying that, because of the error, it is moving back to the get-pay-details state in the larger workflow.



§ Descriptors

After the sorter and the scope, problem codes consist of one or more descriptors. These are kebab-case tokens separated by the . character, where the semantics get progressively more detailed reading left to right. Senders of problem reports SHOULD include at least one descriptor in their problem code, and SHOULD use the most specific descriptor they can. Recipients MAY specialize their reactions to problems in a very granular way, or MAY examine only a prefix of a problem code.



The following descriptor tokens are defined. They can be used by themselves, or as prefixes to more specific descriptors. Additional descriptors — particularly more granular ones — may be defined in individual protocols.



Token	Value of comment string	Notes

trust	Failed to achieve required trust.	Typically this code indicates incorrect or suboptimal behavior by the sender of a previous message in a protocol. For example, a protocol required a known sender but a message arrived anoncrypted instead — or the encryption is well formed and usable, but is considered weak. Problems with this descriptor are similar to those reported by HTTP’s 401, 403, or 407 status codes.

trust.crypto	Cryptographic operation failed.	A cryptographic operation cannot be performed, or it gives results that indicate tampering or incorrectness. For example, a key is invalid — or the key types used by another party are not supported — or a signature doesn’t verify — or a message won’t decrypt with the specified key.

xfer	Unable to transport data.	The problem is with the mechanics of moving messages or associated data over a transport. For example, the sender failed to download an external attachment — or attempted to contact an endpoint, but found nobody listening on the specified port.

did	DID is unusable.	A DID is unusable because its method is unsupported — or because its DID doc cannot be parsed — or because its DID doc lacks required data.

msg	Bad message.	Something is wrong with content as seen by application-level protocols (i.e., in a plaintext message). For example, the message might lack a required field, use an unsupported version, or hold data with logical contradictions. Problems in this category resemble HTTP’s 400 status code.

me	Internal error.	The problem is with conditions inside the problem sender’s system. For example, the sender is too busy to do the work entailed by the next step in the active protocol. Problems in this category resemble HTTP’s 5xx status codes.

me.res	A required resource is inadequate or unavailable.	The following subdescriptors are also defined: me.res.net, me.res.memory, me.res.storage, me.res.compute, me.res.money

req	Circumstances don’t satisfy requirements.	A behavior occurred out of order or without satisfying certain preconditions — or circumstances changed in a way that violates constraints. For example, a protocol that books plane tickets fails because, halfway through, it is discovered that all tickets on the flight have been sold.

req.time	Failed to satisfy timing constraints.	A message has expired — or a protocol has timed out — or it is the wrong time of day/day of week.

legal	Failed for legal reasons.	An injunction or a regulatory requirement prevents progress on the workflow. Compare HTTP status code 451.

§

Replying to Warnings

When Alice sends a w.\* problem report to Bob, and Bob decides that the warning is actually an error, he SHOULD reply to Alice to let her know about the consequences of his evaluation. Bob’s reply is another problem report. It looks very similar to Alice’s original message, except:



The code in Bob’s message now begins with e.. The remainder of the code MAY (often will be) identical, but this is not required; if Bob knows more details than Alice did, he SHOULD provide them. The scope in Bob’s code MUST be at least as broad as the scope in Alice’s original message. (For example, Bob MUST NOT use scope m to say the protocol continues with only a bad message ignored, if Alice’s original warning said she considered the scope to be p.)

The args property may or may not match.

The id header for Bob’s message has a new value. (Bob’s message and Alice’s MUST both be part of the same thread, so Bob’s message is processed as a reply to Alice’s. See Threading.)

§

Cascading Problems

Many problems may be experienced during a long-running or complex protocol. Implementers must have the option of tolerating and recovering from them, if we want robustness; perhaps several network retries will be followed by eventual success. However, care must be exercised to prevent situations where malformed or careless problem reports trigger infinite recursion or vicious cycles:



Implementations SHOULD consider implementing a circuit breaker design pattern to prevent this problem.

Timeouts SHOULD be used judiciously.

Implementations SHOULD use their own configuration or judgment to establish some type of max error count as they begin a protocol instance. This limit could be protocol-specific, and could be evaluated per unit time (e.g., in a human chat protocol of infinite duration, perhaps the limit is max errors per hour rather than max errors across all time). If implementations establish such a limit, they SHOULD check to see whether this count has been exceeded, both when they receive and when they emit errors. If the limit is crossed as a result of a problem report they receive, they SHOULD send back a problem report with "code": "e.p.req.max-errors-exceeded" to abort the protocol. If the limit is crossed as a result of an error they are emitting, they MUST NOT emit the problem report for the triggering error; instead, they MUST emit a problem report with "code": "e.p.req.max-errors-exceeded" to abort the protocol. In either case, they MUST cease responding to messages that use the thid of that protocol instance, once this limit has been crossed.

§

Route Tracing

To troubleshoot routing issues, DIDComm offers a header, trace. Any party that processes a DIDComm plaintext message containing this header MAY do an HTTP POST of a route trace report to the URI in the header’s value. A trace report is a message that looks like this:



{

&nbsp; "type": "https://didcomm.org/trace/2.0/trace\_report",

&nbsp; "pthid": "98fd8d72-80f6-4419-abc2-c65ea39d0f38.1",

&nbsp; "handler": "did:example:1234abcd#3",

&nbsp; "traced\_type": "https://didcomm.org/routing/2.0/forward",

}

The value of pthid is always the message ID that triggered the trace. The value of handler is an arbitrary string that identifies the agent, service, or piece of software responding to the trace.



For the sake of consistency, this message uses some structural conventions that match a DIDComm plaintext message. However, it need not be understood as a message in a DIDComm protocol. It can be parsed by any consumer of generic JSON, it can be transmitted using any channel that suits the sender and receiver, and it is not associated with any interaction state.



Note: This mechanism is not intended to profile timing or performance, and thus does not cover the same problem space as technologies like OpenTelemetry. It also spans trust domains (paralleling a message’s journey from Alice to a web service hosting Bob’s endpoint, to Bob himself) — and thus differs in scope from in-house logging and monitoring technolgies like Splunk and Logstash/Kibana. Although DIDComm tracing could be integrated with these other technologies, doing so in a methodical way is probably an antipattern; it may indicate a misunderstanding about its purpose as a tool for ad hoc debugging or troubleshooting between unrelated parties.



For example, in a message for Bob that is double-wrapped (once for his external mediator and once for his cloud agent), three plaintext messages might contain trace headers:



The outermost message, decrypted by Bob’s external mediator, containing forwarding instructions to Bob’s cloud agent.

The center message, decrypted by Bob’s cloud agent, containing an inner encrypted payload and instructions to forward it to Bob’s DID.

The inner message, seen by Bob’s iPhone.

If Alice, the sender of this message, includes a trace header on each one, and if handlers of this message along the route cooperate with her request to trace, then Alice can learn where in a route a message delivery is failing.



Tracing has security, privacy, and performance implications. Support for tracing is not required of DIDComm implementations, but it is recommended for parties that need sophisticated debugging. Parties that implement tracing MUST decide whether or not to honor trace requests based upon a policy that ensures accountability and transparency, and MUST default to reject tracing requests unless they have independent reason to believe that appropriate safeguards are in place.



§

Threading

DIDComm provides threading as foundation for extremely powerful protocol features. For background on the intent and best practices for threading, please see the DIDComm Guidebook.



§

Message IDs

All plaintext DIDComm messages MUST have an id property, declared in the JWM headers. A message without an id property SHOULD be considered invalid and SHOULD be rejected; it MUST NOT be interpreted as part of a multi-message interaction.



The value of id is a short (<=32 bytes) string consisting entirely of unreserved URI characters — meaning that it is not necessary to percent encode the value to incorporate it in a URI. Beyond this requirement, its format is not strongly constrained, but use of UUIDs (RFC 4122) is recommended. Because of the affinity for UUIDs, this field inherits UUID case-sensitivity semantics: it SHOULD be written in lower case but MUST be compared case-insensitively.



The value of an id property SHOULD be globally, universally unique; at the very least, it MUST be unique across all interactions visible to the set of parties that see a given set of interactions.



§

Threads

A thread is uniquely identified by a thread ID. The thread ID is communicated by including a thid header in the JWM plaintext. The value of thid MUST conform to the same constraints as the value of id. The DIDComm plaintext message that begins a thread MAY declare this property for the new thread. If no thid property is declared in the first message of an interaction, the id property of the message MUST be treated as the value of the thid as well; that is, the message is interpreted as if both id and thid were present, containing the same value.



All subsequent messages in a thread MUST include a thid header that contains the same value as the thid set in the first message of the thread. Messages that do not share the same thid MUST NOT be considered a part of the same thread.



§

Parent Threads

When one interaction triggers another, the first interaction is called the parent of the second. This MAY be modeled by incorporating a pthid header in the JWM plaintext of the child. The value of the child’s pthid header MUST obey the same constraints as thid and id values.



Suppose a DIDComm-based protocol (and therefore, a thread of messages) is underway in which an issuer wants to give a credential to a holder. Perhaps the issuer asks the prospective holder of the credential to pay for what they’re about to receive. For many reasons (including composability, encapsulation, reusability, and versioning), negotiating and consummating payment is best modeled as a separable interaction from credential exchange. Thus, a new thread of messages (dedicated to payment) begins. In this example, the credential issuance interaction (message thread 1) is the parent of the payment interaction (message thread 2). The first message in thread 2 MUST contain a pthid header that references the thid from thread 1:



{

&nbsp; "id": "new-uuid-for-payment-thread",

&nbsp; "pthid": "id-of-old-credential-issuance-thread",

When a child protocol is a simple two-party interaction, mentioning the pthid in the first message of the child interaction is enough to establish context. However, in protocols involving more than two parties, the first message of the child protocol may not be seen by everyone, so simply mentioning pthid once may not provide enough context. Therefore, the rule is that each party in a child protocol MUST learn the identity of the parent thread via the first child protocol message they see. The simplest way to ensure this is to mention the pthid with every message in the child protocol.



§

Message URIs

The id, thid, and pthid properties of any DIDComm message may be combined to form a URI that uniquely identifies the message (e.g., in debuggers, in log files, in archives). Such a scheme is out of scope for this spec, and support for it is OPTIONAL for implementers.



§

Gaps, Resends, and Sophisticated Ordering

Message IDs and threads can be used to build very powerful features for detecting missing and out-of-order messages — and to recover from them. For more information, see the Advanced Sequencing Extension.



§

Transports

§

Summary

DIDComm Messaging is designed to be transport-independent. Regardless of transport, the encryption envelope provides confidentiality, integrity, and (for authcrypt) authentication, providing trust as a feature of each message. However, each transport does have unique features; DIDComm defines conventions that help to align usage. The normative statements below do not prevent someone from using DIDComm + a transport in custom ways; they simply specify one collection of choices that is standardized.



§

Delivery

DIDComm Transports serve only as message delivery. No information about the effects or results from a message is transmitted over the same connection.



§

Transport Requirements

Each transport MUST define:



format of serviceEndpoint uri: Which URI schemes are used (if URI), or the properties of the object (if object).

how to actually send messages: e.g., through HTTPS POST, through dial protocol (libp2p), etc.

how IANA media types of the content are provided, e.g., through Content-Type header, etc.

where additional context definition is hosted, e.g., in case the serviceEndpoint object has extra properties specific to the transport.

§

Agent Constraint Disclosure

As mentioned above, DIDComm Messaging is designed to be transport-independent. Given the wide variety of transports that can be conceived, some agents may have additional constraints that they would like to disclose regarding how they communicate. These generic and customizable constraints may vary over time or be unique to special categories of agents and may be expressed using using the Discover Features Protocol. The following includes a subset of the many different agent constraints that can be expressed:



§

max\_receive\_bytes

The optional max\_receive\_bytes constraint is used to specify the total length of the DIDComm header plus the size of the message payload that an agent is willing to receive. While the core DIDComm protocol itself does not impose a specific maximum size for DIDComm messages, a particular agent may have specific requirements that necessitate only receiving messages up to a specific length. For example, IoT devices that may not have the bandwidth or buffering capabilites to accept large messages may choose to only accept small messages. The definition of large vs small is subjective and may be defined according to the needs of each implementing agent.



When a max\_receive\_bytes constraint is specified, any received message that exceeds the agent’s stated maximum may be discarded. It is recommended that the agent imposing the constraint send a problem report citing the constraint as the cause of a reception error. The associated Problem Code is me.res.storage.message\_too\_big. However, sending a response in the opposite direction on a DIDComm channel may not always be possible, given simplex transports and complex delivery routes. Therefore, it is also appropriate to emit an error at the transport level, such as HTTP 413 Request Too Large. Agents that receive problem reports or transport-level errors, or that experience a lack of response, may test whether this constraint is the cause using standard DIDComm troubleshooting techniques, such as Route Tracing.



Prior to transmission, a sending agent may query a receiving agent for a maximum message length limitation using the Discover Features Protocol. Using the Discover Features Protocol, a max\_receive\_bytes query message may look like this:



{

&nbsp;   "type": "https://didcomm.org/discover-features/2.0/queries",

&nbsp;   "id": "yWd8wfYzhmuXX3hmLNaV5bVbAjbWaU",

&nbsp;   "body": {

&nbsp;       "queries": \[

&nbsp;           { "feature-type": "constraint", "match": "max\_receive\_bytes" }

&nbsp;       ]

&nbsp;   }

}

In response to a max\_receive\_bytes request, a Discover Features disclose message may look like this:



{

&nbsp;   "type": "https://didcomm.org/discover-features/2.0/disclose",

&nbsp;   "thid": "yWd8wfYzhmuXX3hmLNaV5bVbAjbWaU",

&nbsp;   "body":{

&nbsp;       "disclosures": \[

&nbsp;           {

&nbsp;               "feature-type": "constraint",

&nbsp;               "id": "max\_receive\_bytes",

&nbsp;               "max\_receive\_bytes": "65536"

&nbsp;           }

&nbsp;       ]

&nbsp;   }

}

§

Reference

§

HTTPS

HTTPS transports are an effective way to send a message to another online agent.



Messages MUST be transported via HTTPS POST.

The IANA media type for the POST request MUST be set to the corresponding media type, e.g., application/didcomm-encrypted+json.

A successful message receipt MUST return a code in the 2xx HTTPS Status Code range. 202 Accepted is recommended.

POST requests are used only for one-way transmission from sender to receiver; responses don’t flow back in the web server’s HTTP response.

HTTPS Redirects SHOULD be followed. Only temporary redirects (307) are acceptable. Permanent endpoint relocation should be managed with a DID Document update.

Using HTTPS with TLS 1.2 or greater with a cipher suite providing Perfect Forward Secrecy (PFS) allows a transmission to benefit from PFS that’s already available at the transport level.

§

WebSockets

Websockets are an efficient way to transmit multiple messages without the overhead of individual requests. This is useful in a high bandwidth situation.



Each message MUST be transmitted individually; if encryption or signing are used, the unit of encryption or signing is one message only.

The trust of each message MUST be associated with DIDComm encryption or signing, not from the socket connection itself.

Websockets are used only for one-way transmission from sender to receiver; responses don’t flow back the other way on the socket.

Using Secure Websockets (wss://) with TLS 1.2 or greater with a cipher suite providing Perfect Forward Secrecy (PFS) allows a transmission to benefit from PFS that’s already available at the transport level.

When using STOMP over WebSocket, the content-type header is application/didcomm-encrypted+json as in the HTTPS message.

§

Protocols

The primitives described earlier in this spec standardize basic behaviors in peer-to-peer secure communication: signing, encryption, plaintext structure, passing metadata in headers, reporting problems, attaching content, etc. Developers can use these primitives to design any number of high-trust, application-level protocols for dedicated purposes, and then compose them into ever broader workflows in arbitrary, powerful ways. Community efforts to design and share protocols can happen anywhere; one locus of that work is didcomm.org.



A few higher-level protocols are especially fundamental, in that they bootstrap communication and discovery. Those protocols and their underlying principles are described below.



§

Protocol Identifier URI

Each protocol constructed atop DIDComm Messaging is uniquely identified and versioned by a Protocol Identifier URI (PIURI).



The PIURI MUST be composed of a sequence of tokens as follows:



doc-uri delim protocol-name/semver

As ABNF:



protocol-identifier-uri = doc-uri delim protocol-name "/" semver

delim                   = "?" / "/" / "\&" / ":" / ";" / "="

It can be loosely matched and parsed with the following regex:



(.\*?)(\[a-z0-9.\_-]+)/(\\d\[^/]\*)/?$

The PIURI for an imaginary protocol to schedule lunch appointments might resemble one of the following:



https://didcomm.org/lets\_do\_lunch/1.0

https://example.com/protocols?which=lets\_do\_lunch/1.0

did:example:1234567890;spec/lets\_do\_lunch/1.0/ping

https://github.com/myorg/myproject/tree/master/docs/lets\_do\_lunch/1.0

The PIURI for a given protocol SHOULD resolve to human-friendly documentation about the protocol.



§

Message Type URI

A Message Type URI (MTURI) identifies plaintext message types unambiguously. Since the names of message types are only unique within the context of the protocol they embody, an MTURI begins with a prefix that is a PIURI, and then adds a message name token as a suffix.



Standardizing MTURI format is important because MTURIs are parsed by agents and used to map messages to handlers. Code will look at this string and say, “Do I have something that can handle this message type inside protocol X version Y?” When that analysis happens, it must do more than compare the string for exact equality. It may need to check for semver compatibility, and it has to compare the protocol name and message type name ignoring case and punctuation.



The MTURI MUST be composed of a sequence of tokens as follows:



protocol-identifier-uri/message-type-name

As ABNF:



message-type-uri  = protocol-identifier-uri "/" message-type-name

protocol-identifier-uri = doc-uri delim protocol-name "/" semver

delim                   = "?" / "/" / "\&" / ":" / ";" / "="

protocol-name     = identifier

protocol-version  = semver

message-type-name = identifier

identifier        = alpha \*(\*(alphanum / "\_" / "-" / ".") alphanum)

It can be loosely matched and parsed with the following regex:



&nbsp;   (.\*?)(\[a-z0-9.\_-]+)/(\\d\[^/]\*)/(\[a-z0-9.\_-]+)$

A match will have capturing groups of (1) = doc-uri, (2) = protocol-name, (3) = protocol-version, and (4) = message-type-name.



Building on our previous examples of lets\_do\_lunch PIURIs, the MTURI of a proposal message in that protocol might be something like:



https://didcomm.org/lets\_do\_lunch/1.0/proposal

https://example.com/protocols?which=lets\_do\_lunch/1.0/proposal

did:example:1234567890;spec/lets\_do\_lunch/1.0/proposal

https://github.com/myorg/myproject/tree/master/docs/lets\_do\_lunch/1.0/proposal

§

Semver Rules

The version numbers embedded in PIURIs and MTURIs MUST follow familiar semver rules, such that two parties that support the same protocol at the same major version but different minor versions could theoretically interoperate with a feature profile that matches the older of their two versions. (Of course, this does not guarantee interoperability; the party supporting a newer version still chooses whether they want to support the older version or not. Semver rules simply define how a version mismatch must be interpreted.)



The major component of a protocol’s semver value MUST be updated under either of the following conditions:



A change breaks important assumptions about the intent, preconditions, postconditions, or state machine of a protocol.

A change adds or removes required fields or required messages.

The minor component of a protocol’s semver value MUST be updated when a change does not justify a major number update, but it is more than a trivial update to documentation. Examples of minor version changes include adding new, optional fields or deprecating existing fields.



The patch component of a protocol’s semver value is not used in MTURIs and PIURIs.



§

Routing Protocol 2.0

The routing protocol defines how a sender and a recipient cooperate, using a partly trusted mediator, to facilitate message delivery. No party is required to know the full route of a message.



§

Name and Version

The name of this protocol is “Routing Protocol”, and its version is “2.0”. It is uniquely identified by the PIURI:



https://didcomm.org/routing/2.0

§

Roles

There are 3 roles in the protocol: sender, mediator, and recipient. The sender emits messages of type forward to the mediator. The mediator unpacks (decrypts) the payload of an encrypted forward message and passes on the result (a blob that probably contains a differently encrypted payload) to the recipient.



ordinary sequence



Note: the protocol is one-way; the return route for communication might not exist at all, or if it did, it could invert the roles of sender and receiver and use the same mediator, or it could use one or more different mediators, or it could use no mediator at all. This is a separate concern partly specified by the service endpoints in the DID docs of the sender and receiver, and partly explored in other protocols.



Note: When the mediator is the routing agent of a single identity subject like Alice, the logical receiver is Alice herself, but the physical receiver may manifest as multiple edge devices (a phone, a laptop, a tablet). From the perspective of this protocol, multiplexing the send from mediator to receiver is out of scope for interoperability — compatible and fully supported, but not required or specified in any way.



In this protocol, the sender and the receiver never interact directly; they only interact via the mediator.



The sender can add the standard expires\_time to a forward message. An additional header, delay\_milli is also possible; this allows the sender to request that a mediator wait a specified number of milliseconds before delivering. Negative values mean that the mediator should randomize delay by picking a number of milliseconds between 0 and the absolute value of the number, with a uniform distribution.



The mediator is NOT required to support or implement any of these semantics; only the core forwarding behavior is indispensable. If a mediator sees a header that requests behavior it doesn’t support, it MAY return a problem-report to the sender identifying the unsupported feature, but it is not required to do so.



Note: The please\_ack header SHOULD NOT be included on forward messages, and MUST NOT be honored by mediators. It is only for use between ultimate senders and receivers; otherwise, it would add a burden of sourceward communication to mediators, and undermine the privacy of recipients.



§

States

Since data flow is normally one-way, and since the scope of the protocol is a single message delivery, a simplistic way to understand it might be as two instances of a stateless notification pattern, unfolding in sequence.



However, this doesn’t quite work on close inspection, because the mediator is at least potentially stateful with respect to any particular message; it needs to be if it wants to implement delayed delivery or retry logic. (Or, as noted earlier, the possibility of sending to multiple physical receivers. Mediators are not required to implement any of these features, but the state machine needs to account for their possibility.) Plus, the notification terminology obscures the sender and receiver roles. So we use the following formalization:



]



§

Messages

The only message in this protocol is the forward message. A simple and common version of a forward message might look like this:



{

&nbsp;   "type": "https://didcomm.org/routing/2.0/forward",

&nbsp;   "id": "abc123xyz456",

&nbsp;   "to": \["did:example:mediator"],

&nbsp;   "expires\_time": 1516385931,

&nbsp;   "body":{

&nbsp;       "next": "did:foo:1234abcd"

&nbsp;   },

&nbsp;   "attachments": \[

&nbsp;       // The payload(s) to be forwarded

&nbsp;   ]

}

next - REQUIRED. The identifier of the party to send the attached message to.

attachments - REQUIRED. The DIDComm message(s) to send to the party indicated in the next body attribute. This content should be encrypted for the next recipient.

When the internal message expires, it’s a good idea to also include an expiration for forward requests. Include the expires\_time header with the appropriate value.



The value of the next field is typically a DID. However, it may also be a key, for the last hop of a route. The routingKeys array in the serviceEndpoint portion of a DID doc allow a party to list keys that should receive inbound communication, with encryption multiplexed so any of the keys can decrypt. This supports a use case where Alice wants to process messages on any of several devices that she owns.



The attachment(s) in the attachments field are able to use the full power of DIDComm attachments, including features like instructing the receiver to download the payload content from a CDN.



§

Rewrapping

Normally, the payload attached to the forward message received by the mediator is transmitted directly to the receiver with no further packaging. However, optionally, the mediator can attach the opaque payload to a new forward message (appropriately anoncrypted), which then acts as a fresh outer envelope for the second half of the delivery. This rewrapping means that the “onion” of packed messages stays the same size rather than getting smaller as a result of the forward operation:



re-wrapped sequence



Rewrapping mode is invisible to senders, but mediators need to know about it, since they change their behavior as a result. Receivers also need to know about it, because it causes them to receive a double-packaged message instead of a singly-packaged one. The outer envelope is a forward message where to is the receiver itself.



Why is such indirection useful?



It lets the mediator decorate messages with its own timing and tracing mixins, which may aid troubleshooting. (This would otherwise be impossible, since the inner payload is an opaque blob that is almost certainly tamper-evident and encrypted.)

It lets the mediator remain uncommitted to whether the next receiver is another mediator or not. This may provide flexibility in some routing scenarios.

It lets the mediator change the size of the message by adding or subtracting noise from the content.

It allows for dynamic routing late in the delivery chain.

These last two characteristics could provide the foundation of mixnet features for DIDComm; however, such functionality is out of scope in this spec.



§

Sender Process to Enable Forwarding

Construct a plaintext message, M.

If appropriate, sign M.

Encrypt M for each party that is an intended recipient. Assuming each recipient has several keys, corresponding to several devices, but that all the keys are of the same type, this produces a single message, N, for each recipient — and N is decryptable on any device the recipient is using. If Alice is sending to Bob and Carol, this step produces NBob and NCarol, which have identical plaintext but different encrypted embodiments.

Perform a wrapping process that loops in reverse order over all items in the routingKeys array of the service endpoint for the DID document that corresponds to the intended recipient of N. For each item X in that array, beginning at the end of the array and working to its beginning, Sender creates a new plaintext forward message, attaches the current N, and encrypts it for X. The output is a new encrypted message, N’, that is treated as N in the next round of wrapping.

Transmit the fully wrapped version of N to the uri given in the associated serviceEndpoint of the recipient’s DID document.

The party that receives it will have the ability to decrypt. The output of decryption will be a forward message that indicates the next hop from routingKeys in the next attribute of its body. It will also have an encrypted attachment. This attachment is forwarded to the next hop. This unwrapping and forwarding is repeated until the message reaches its final destination.



§

Mediator Process

Prior to using a Mediator, it is the recipient’s responsibility to coordinate with the mediator. Part of this coordination informs them of the next address(es) expected, the endpoint, and any routing keys to be used when forwarding messages. That coordination is out of the scope of this spec.



Receive ‘forward’ message.

Retrieve service endpoint pre-configured by recipient (next attribute).

Transmit payload message to service endpoint in the manner specified in the \[transports] section.

The recipient (next attribute of ‘forward’ message) may have pre-configured additional routing keys with the mediator that were not present in the DID Document and therefore unknown to the original sender. If this is the case, the mediator should wrap the attached payload message into an additional Forward message once per routing key. This step is performed between (2) and (3).



§

DID Document Keys

Ideally, all keys declared in the keyAgreement section of a given recipient’s DID document are used as target keys when encrypting a message. To encourage this, DIDComm encrypts the main message content only once, using an ephemeral content encryption key, and then encrypts the relatively tiny ephemeral key once per recipient key. This “multiplexed encryption” is efficient, and it allows a recipient to change devices over the course of a conversation without prior arrangement.



However, practical considerations can frustrate this ideal. If a recipient’s DID document declares keys of different types, a sender has to prepare more than one encryption envelope — and if not all of a recipient’s key types are supported by the sender, the goal is simply unachievable.



In addition, if a sender is routing the same message to more than one recipient (not just more than one key of the same recipient), the sender has to wrap the message differently because it will flow through different mediators.



This leads to a rule of thumb rather than a strong normative requirement: a sender SHOULD encrypt for as many of a recipient’s keys as is practical.



The details of key representation are described in the Verification Methods section of the DID Core Spec.



Keys used in a signed JWM are declared in the DID Document’s authentication section.



§

Service Endpoint

Parties who wish to communicate via DIDComm Messaging MAY tell other parties how to reach them by declaring a serviceEndpoint block in their DID document. The serviceEndpoint may be specified as a single serviceEndpoint or an array of serviceEndpoint objects. This enables DIDComm routing and provides multiple serviceEndpoints when needed.



The relevant entry in the DID document matches one of the following formats:



{

&nbsp;   "id": "did:example:123456789abcdefghi#didcomm-1",

&nbsp;   "type": "DIDCommMessaging",

&nbsp;   "serviceEndpoint": {

&nbsp;       "uri": "https://example.com/path",

&nbsp;       "accept": \[

&nbsp;           "didcomm/v2",

&nbsp;           "didcomm/aip2;env=rfc587"

&nbsp;       ],

&nbsp;       "routingKeys": \["did:example:somemediator#somekey"]

&nbsp;   }

}

or



{

&nbsp;   "id": "did:example:123456789abcdefghi#didcomm-1",

&nbsp;   "type": "DIDCommMessaging",

&nbsp;   "serviceEndpoint": \[{

&nbsp;       "uri": "https://example.com/path",

&nbsp;       "accept": \[

&nbsp;           "didcomm/v2",

&nbsp;           "didcomm/aip2;env=rfc587"

&nbsp;       ],

&nbsp;       "routingKeys": \["did:example:somemediator#somekey"]

&nbsp;   }]

}

id - REQUIRED. Must be unique, as required in DID Core. No special meaning should be inferred from the id chosen.



type - REQUIRED. MUST be DIDCommMessaging.



serviceEndpoint - REQUIRED. As described above, a serviceEndpoint MUST contain an object or an array of objects. Each represents a DIDComm Service Endpoint URI and its associated details. The order of the endpoints SHOULD indicate the DID Document owner’s preference in receiving messages. Any endpoint MAY be selected by the sender, typically by protocol availability or preference. A message should be delivered to only one of the endpoints specified.



Each serviceEndpoint object has the following properties:



uri - REQUIRED. MUST contain a URI for a transport specified in the \[transports] section of this spec, or a URI from Alternative Endpoints. It MAY be desirable to constraint endpoints from the \[transports] section so that they are used only for the reception of DIDComm messages. This can be particularly helpful in cases where auto-detecting message types is inefficient or undesirable.



accept - OPTIONAL. An array of media types in the order of preference for sending a message to the endpoint. These identify a profile of DIDComm Messaging that the endpoint supports. If accept is not specified, the sender uses its preferred choice for sending a message to the endpoint. Please see Negotiating Compatibility for details.



routingKeys - OPTIONAL. An ordered array of strings referencing keys to be used when preparing the message for transmission as specified in Sender Process to Enable Forwarding, above.



§

Failover

If the transmission of a message fails, the sender SHOULD try another endpoint or try delivery at a later time.



§

Using a DID as an endpoint

In addition to the sorts of URIs familiar to all web developers, it is possible to use a DID as the uri value in a serviceEndpoint. This is useful when a recipient sits behind a mediator, because it allows the mediator to rotate its keys or update its own service endpoints without disrupting communication between sender and recipient. In such cases, the DID (which belongs to the mediator) is resolved. Inside the resulting DID document, a serviceEndpoint with type DIDCommMessaging MUST exist. The keyAgreement keys of the mediator are implicitly prepended to the routingKeys section from the message recipient’s DID Document as per the process in Sender Process to Enable Forwarding.



A DID representing a mediator SHOULD NOT use alternative endpoints in its own DID Document to avoid recursive endpoint resolution. Using only the URIs described in Transports will prevent such recursion.



Endpoint Example 1: Mediator



{

&nbsp;   "id": "did:example:123456789abcdefghi#didcomm-1",

&nbsp;   "type": "DIDCommMessaging",

&nbsp;   "serviceEndpoint": {

&nbsp;       "uri": "did:example:somemediator"

&nbsp;   }

}

The message is encrypted to the recipient, then wrapped in a ‘forward’ message encrypted to the keyAgreement keys within the did:example:somemediator DID Document, and transmitted to the URIs present in the did:example:somemediator DID Document with type DIDCommMessaging.



Endpoint Example 2: Mediator + Routing Keys



{

&nbsp;   "id": "did:example:123456789abcdefghi#didcomm-1",

&nbsp;   "type": "DIDCommMessaging",

&nbsp;   "serviceEndpoint": {

&nbsp;       "uri": "did:example:somemediator",

&nbsp;       "routingKeys": \["did:example:anothermediator#somekey"]

&nbsp;   }

}

The message is encrypted to the recipient, then wrapped in a forward message encrypted to did:example:anothermediator#somekey. That message is wrapped in a ‘forward’ message encrypted to ‘keyAgreement’ keys within the did:example:somemediator DID Document, and transmitted to the URIs present in the did:example:somemediator DID Document with type DIDCommMessaging.



§

Out Of Band Messages

§

URL \& QR Codes

When passing a DIDComm message between two parties, it is often useful to present a message in the form of a URL or encoded into the form of a QR code for scanning with a smartphone or other camera. The format for a QR code is simply the encoded URL form of a message.



§

Privacy Considerations

Any information passed via a URL or QR code is unencrypted, and may be observed by another party. This lack of privacy must be minded in two different ways.



First, no private information may be passed in the message. Private information should be passed between parties in encrypted messages only. Any protocol message that contains private information should not be passed via URL or QR code.



Second, any identifiers passed in a message sent via URL or QR code must no longer be considered private. Any DID used or other identifier no longer considered private MUST be rotated over a secure connection if privacy is required.



§

Message Correlation

The id of the message passed in a URL or a QR code is used as the pthid on a response sent by the recipient of this message. The response recipient can use the pthid to correlate it with the original message.



§

Invitation

Each message passed this way must be contained within an out-of-band message, as described below.



The out-of-band protocol consists in a single message that is sent by the sender.



{

&nbsp; "type": "https://didcomm.org/out-of-band/2.0/invitation",

&nbsp; "id": "<id used for context as pthid>",

&nbsp; "from":"<sender's did>",

&nbsp; "body": {

&nbsp;   "goal\_code": "issue-vc",

&nbsp;   "goal": "To issue a Faber College Graduate credential",

&nbsp;   "accept": \[

&nbsp;     "didcomm/v2",

&nbsp;     "didcomm/aip2;env=rfc587"

&nbsp;   ]

&nbsp; },

&nbsp; "attachments": \[

&nbsp;   {

&nbsp;       "id": "request-0",

&nbsp;       "media\_type": "application/json",

&nbsp;       "data": {

&nbsp;           "json": "<json of protocol message>"

&nbsp;       }

&nbsp;   }

&nbsp; ]

}

The items in the message are:



type - REQUIRED. The header conveying the DIDComm MTURI.

id - REQUIRED. This value MUST be used as the parent thread ID (pthid) for the response message that follows. This may feel counter-intuitive — why not it in the thid of the response instead? The answer is that putting it in pthid enables multiple, independent interactions (threads) to be triggered from a single out-of-band invitation.

from - REQUIRED for OOB usage. The DID representing the sender to be used by recipients for future interactions.

goal\_code - OPTIONAL. A self-attested code the receiver may want to display to the user or use in automatically deciding what to do with the out-of-band message.

goal - OPTIONAL. A self-attested string that the receiver may want to display to the user about the context-specific goal of the out-of-band message.

accept - OPTIONAL. An array of media types in the order of preference for sending a message to the endpoint. These identify a profile of DIDComm Messaging that the endpoint supports. If accept is not specified, the sender uses its preferred choice for sending a message to the endpoint. Please see Negotiating Compatibility for details.

attachments - OPTIONAL. An array of attachments that will contain the invitation messages in order of preference that the receiver can use in responding to the message. Each message in the array is a rough equivalent of the others, and all are in pursuit of the stated goal and goal\_code. Only one of the messages should be chosen and acted upon. (While the JSON form of the attachment is used in the example above, the sender could choose to use the base64 form.)

When encoding a message in a URL or QR code, the sender does not know which protocols are supported by the recipient of the message. Encoding multiple alternative messages is a form of optimistic protocol negotiation that allows multiple supported protocols without coordination



§

Standard Message Encoding

Using a standard message encoding allows for easier interoperability between multiple projects and software platforms. Using a URL for that standard encoding provides a built in fallback flow for users who are unable to automatically process the message. Those new users will load the URL in a browser as a default behavior, and may be presented with instructions on how to install software capable of processing the message. Already onboarded users will be able to process the message without loading in a browser via mobile app URL capture, or via capability detection after being loaded in a browser.



The standard message format is a URL with a Base64URLEncoded plaintext JWM json object as a query parameter.



The URL format is as follows, with some elements described below:



https://<domain>/<path>?\_oob=<encodedplaintextjwm>

<domain> and <path> should be kept as short as possible, and the full URL should return human readable instructions when loaded in a browser. This is intended to aid new users. The \_oob query parameter is required and is reserved to contain the DIDComm message string. Additional path elements or query parameters are allowed, and can be leveraged to provide coupons or other promise of payment for new users.



\_oob is a shortened form of Out of Band, and was chosen to not conflict with query parameter names in use at a particular domain. When the query parameter is detected, it may be assumed to be an Out Of Band message with a reasonably high confidence.



When this spec was written, the didcomm:// URL scheme was in active use for deep linking in mobile apps, and had features that intersect with the OOB protocol described here. That scheme is defined elsewhere; we only note it here to advise against its overloading for other purposes.



The <encodedplaintextjwm> is a JWM plaintext message that has been base64-url encoded.



encodedplaintextjwm = b64urlencode(<plaintextjwm>)

During encoding, whitespace from the json string should be eliminated to keep the resulting out-of-band message string as short as possible.



§ Example Out-of-Band Message Encoding

Invitation:



{

&nbsp; "type": "https://didcomm.org/out-of-band/2.0/invitation",

&nbsp; "id": "69212a3a-d068-4f9d-a2dd-4741bca89af3",

&nbsp; "from": "did:example:alice",

&nbsp; "body": {

&nbsp;     "goal\_code": "",

&nbsp;     "goal": ""

&nbsp; },

&nbsp; "attachments": \[

&nbsp;     {

&nbsp;         "id": "request-0",

&nbsp;         "media\_type": "application/json",

&nbsp;         "data": {

&nbsp;             "json": "<json of protocol message>"

&nbsp;         }

&nbsp;     }

&nbsp; ]

}

Whitespace removed:



{"type":"https://didcomm.org/out-of-band/2.0/invitation","id":"69212a3a-d068-4f9d-a2dd-4741bca89af3","from":"did:example:alice","body":{"goal\_code":"","goal":""},"attachments":\[{"id":"request-0","media\_type":"application/json","data":{"json":"<json of protocol message>"}}]}

Base 64 URL Encoded:



eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNjkyMTJhM2EtZDA2OC00ZjlkLWEyZGQtNDc0MWJjYTg5YWYzIiwiZnJvbSI6ImRpZDpleGFtcGxlOmFsaWNlIiwiYm9keSI6eyJnb2FsX2NvZGUiOiIiLCJnb2FsIjoiIn0sImF0dGFjaG1lbnRzIjpbeyJpZCI6InJlcXVlc3QtMCIsIm1lZGlhX3R5cGUiOiJhcHBsaWNhdGlvbi9qc29uIiwiZGF0YSI6eyJqc29uIjoiPGpzb24gb2YgcHJvdG9jb2wgbWVzc2FnZT4ifX1dfQ

Example URL:



https://example.com/path?\_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNjkyMTJhM2EtZDA2OC00ZjlkLWEyZGQtNDc0MWJjYTg5YWYzIiwiZnJvbSI6ImRpZDpleGFtcGxlOmFsaWNlIiwiYm9keSI6eyJnb2FsX2NvZGUiOiIiLCJnb2FsIjoiIn0sImF0dGFjaG1lbnRzIjpbeyJpZCI6InJlcXVlc3QtMCIsIm1lZGlhX3R5cGUiOiJhcHBsaWNhdGlvbi9qc29uIiwiZGF0YSI6eyJqc29uIjoiPGpzb24gb2YgcHJvdG9jb2wgbWVzc2FnZT4ifX1dfQ

DIDComm message URLs can be transferred via any method that can send text, including an email, SMS, posting on a website, or QR Code.



Example Email Message:



To: alice@example.com

From: studentrecords@example.com

Subject: Your request to connect and receive your graduate verifiable credential



Dear Alice,



To receive your Faber College graduation certificate, click here to \[connect](https://example.com/path?\_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNjkyMTJhM2EtZDA2OC00ZjlkLWEyZGQtNDc0MWJjYTg5YWYzIiwiZnJvbSI6ImRpZDpleGFtcGxlOmFsaWNlIiwiYm9keSI6eyJnb2FsX2NvZGUiOiIiLCJnb2FsIjoiIn0sImF0dGFjaG1lbnRzIjpbeyJpZCI6InJlcXVlc3QtMCIsIm1lZGlhX3R5cGUiOiJhcHBsaWNhdGlvbi9qc29uIiwiZGF0YSI6eyJqc29uIjoiPGpzb24gb2YgcHJvdG9jb2wgbWVzc2FnZT4ifX1dfQ with us, or paste the following into your browser:



https://example.com/path?\_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNjkyMTJhM2EtZDA2OC00ZjlkLWEyZGQtNDc0MWJjYTg5YWYzIiwiZnJvbSI6ImRpZDpleGFtcGxlOmFsaWNlIiwiYm9keSI6eyJnb2FsX2NvZGUiOiIiLCJnb2FsIjoiIn0sImF0dGFjaG1lbnRzIjpbeyJpZCI6InJlcXVlc3QtMCIsIm1lZGlhX3R5cGUiOiJhcHBsaWNhdGlvbi9qc29uIiwiZGF0YSI6eyJqc29uIjoiPGpzb24gb2YgcHJvdG9jb2wgbWVzc2FnZT4ifX1dfQ



If you don't have an identity agent for holding credentials, you will be given instructions on how you can get one.



Thanks,



Faber College

Knowledge is Good

Example URL encoded as a QR Code:



Example QR Code



§

Short URL Message Retrieval

It seems inevitable that the length of some DIDComm messages will be too long to produce a useable QR code. Techniques to avoid unusable QR codes have been presented above, including using attachment links for requests, minimizing the routing of the response and eliminating unnecessary whitespace in the JSON. However, at some point a sender may need generate a very long URL. In that case, a short URL message retrieval redirection should be implemented by the sender as follows:



The sender should generate and track a GUID for the out-of-band message URL.

The shortened version should be: https://example.com/path?\_oobid=5f0e3ffb-3f92-4648-9868-0d6f8889e6f3. Note the replacement of the query parameter \_oob with \_oobid when using shortened URL.

On receipt of this form of message, the agent must do an HTTP GET to retrieve the associated encoded message. A sender may want to wait to generate the full invitation until the redirection event of the shortened URL to the full length form dynamic, so a single QR code can be used for distinct messages.

A usable QR code will always be able to be generated from the shortened form of the URL.



Note: Due to the privacy implications, a standard URL shortening service SHOULD NOT be used.



§

Redirecting Back to Sender

In some cases, interaction between sender and receiver of out-of-band invitation would require receiver application to redirect back to sender.



For example,



A web based verifier sends out-of-band invitation to a holder application and requests redirect back once present proof protocol execution is over, so that it can show credential verification results and guide the user with next steps.

A verifier mobile application sending deep link of its mobile application to an agent based mobile wallet application requesting redirect to verifier mobile application.

These redirects may not be required in many cases, for example,



A mobile application scanning QR code from sender and performing protocol execution. In this case the mobile application may choose to handle successful protocol execution in its own way and close the application.

§ Reference

During the protocol execution sender can securely send web\_redirect information as part of messages concluding protocol executions, like a formal acknowledgement message or a problem report. Once protocol is ended then receiver can optionally choose to redirect by extracting the redirect information from the message.



Example acknowledgement message from verifier to prover containing web redirect information:



{

&nbsp; "type":"https://didcomm.org/present-proof/3.0/ack",

&nbsp; "id":"e2f3747b-41e8-4e46-abab-ba51472ab1c3",

&nbsp; "pthid":"95e63a5f-73e1-46ac-b269-48bb22591bfa",

&nbsp; "from":"did:example:verifier",

&nbsp; "to":\["did:example:prover"],

&nbsp; "web\_redirect":{

&nbsp;   "status":"OK",

&nbsp;   "redirectUrl":"https://example.com/handle-success/51e63a5f-93e1-46ac-b269-66bb22591bfa"

&nbsp; }

}

A problem report with a web redirect header from the problem report example will look like:



{

&nbsp; "type": "https://didcomm.org/report-problem/2.0/problem-report",

&nbsp; "id": "7c9de639-c51c-4d60-ab95-103fa613c805",

&nbsp; "pthid": "1e513ad4-48c9-444e-9e7e-5b8b45c5e325",

&nbsp; "web\_redirect":{

&nbsp;     "status":"FAIL",

&nbsp;     "redirectUrl":"https://example.com/handle-error/99e80a9f-34e1-41ac-b277-91bb64481bxb"

&nbsp;  },

&nbsp; "body": {

&nbsp;   "code": "e.p.xfer.cant-use-endpoint",

&nbsp;   "comment": "Unable to use the {1} endpoint for {2}.",

&nbsp;   "args": \[

&nbsp;     "https://agents.r.us/inbox",

&nbsp;     "did:sov:C805sNYhMrjHiqZDTUASHg"

&nbsp;   ]

&nbsp; }

}

A sender MUST use web\_redirect headers to request redirect from receiver. A web\_redirect header MUST contain status and redirectUrl properties. The value of status property MUST be one of the Acknowledgement statuses defined here which indicates protocol execution outcome.



§

Discover Features Protocol 2.0

This protocol helps agents query one another to discover which features they support, and to what extent.



The identifier for the message family used by this protocol is discover-features, and the fully qualified PIURI for its definition is:



https://didcomm.org/discover-features/2.0

§

Motivation

Though some agents will support just one protocol and will be statically configured to interact with just one other party, many exciting uses of agents are more dynamic and unpredictable. When Alice and Bob meet, they won’t know in advance which features are supported by one another’s agents. They need a way to find out.



Disclosing features in this manner has a significant privacy benefit over endpoint disclosures contained in a DID document published to a Verifiable Data Registry (VDR). Using the single DIDComm endpoint published in the document and this protocol, features can be selectively disclosed to other parties at the owner’s discretion. The problem of anonymous scanning and fingerprinting enabled with VDR disclosures is solved in a privacy preserving way.



§

Roles

There are two roles in the discover-features protocol: requester and responder. The requester asks the responder about the protocols it supports, and the responder answers. Each role uses a single message type.



It is also possible to proactively disclose features; in this case a requester receives a disclosure without asking for it. This may eliminate some chattiness in certain use cases (e.g., where two-way connectivity is limited).



§

States

This is a classic two-step request~response interaction, so it uses the predefined state machines for any requester and responder:



state machines]



§

Messages

§ query Message Type

A discover-features/query message looks like this:



{

&nbsp;   "type": "https://didcomm.org/discover-features/2.0/queries",

&nbsp;   "id": "yWd8wfYzhmuXX3hmLNaV5bVbAjbWaU",

&nbsp;   "body": {

&nbsp;       "queries": \[

&nbsp;           { "feature-type": "protocol", "match": "https://didcomm.org/tictactoe/1.\*" },

&nbsp;           { "feature-type": "goal-code", "match": "org.didcomm.\*" }

&nbsp;       ]

&nbsp;   }

}

Queries messages contain one or more query objects in the queries array. Each query essentially says, “Please tell me what features of type X you support, where the feature identifiers match this (potentially wildcarded) string.” This particular example asks an agent if it supports any 1.x versions of a tictactoe protocol, and if it supports any goal codes that begin with “org.didcomm.”.



Implementations of this protocol must recognize the following values for feature-type: protocol, goal-code, and header. Additional values of feature-type may be used, and unrecognized values MUST be ignored.



Identifiers are used as the value to match against a feature type. Their format varies. For protocols, identifiers are PIURIs. For goal codes, identifiers are goal code values. For governance frameworks, identifiers are URIs where the framework is published. For headers, identifiers are header names.



The match field of a query descriptor may use the \* wildcard. By itself, a match with just the wildcard says, “I’m interested in anything you want to share with me.” But usually, this wildcard will be to match a prefix that’s a little more specific, as in the example that matches any 1.x version.



Any agent may send another agent this message type at any time. Implementers of agents that intend to support dynamic relationships and rich features are strongly encouraged to implement support for this message, as it is likely to be among the first messages exchanged with a stranger.



§ disclose Message Type

A discover-features/disclose message looks like this:



{

&nbsp;   "type": "https://didcomm.org/discover-features/2.0/disclose",

&nbsp;   "thid": "yWd8wfYzhmuXX3hmLNaV5bVbAjbWaU",

&nbsp;   "body":{

&nbsp;       "disclosures": \[

&nbsp;           {

&nbsp;               "feature-type": "protocol",

&nbsp;               "id": "https://didcomm.org/tictactoe/1.0",

&nbsp;               "roles": \["player"]

&nbsp;           },

&nbsp;           {

&nbsp;               "feature-type": "goal-code",

&nbsp;               "id": "org.didcomm.sell.goods.consumer"

&nbsp;           }

&nbsp;       ]

&nbsp;   }

}

The disclosures field is a JSON array of zero or more disclosure objects that describe a feature. Each descriptor has a feature-type field that contains data corresponding to feature-type in a query object, and an id field that unambiguously identifies a single item of that feature type. When the item is a protocol, the disclosure object may also contain a roles array that enumerates the roles the responding agent can play in the associated protocol. Future feature types may add additional optional fields, though no other fields are being standardized with this version of the spec.



Disclosures messages say, “Here are some features I support (that matched your queries).”



§ Sparse Responses

Disclosures do not have to contain exhaustive detail. For example, the following response omits the optional roles field but may be just as useful as one that includes it:



{

&nbsp; "type": "https://didcomm.org/discover-features/2.0/disclose",

&nbsp; "thid": "yWd8wfYzhmuXX3hmLNaV5bVbAjbWaU",

&nbsp;   "body": {

&nbsp;       "disclosures": \[

&nbsp;           {"feature-type": "protocol", "id": "https://didcomm.org/tictactoe/1.0"}

&nbsp;       ]

&nbsp;   }

}

Less detail probably suffices because agents do not need to know everything about one another’s implementations in order to start an interaction — usually the flow will organically reveal what’s needed. For example, the outcome message in the tictactoe protocol isn’t needed until the end, and is optional anyway. Alice can start a tictactoe game with Bob and will eventually see whether he has the right idea about outcome messages.



The missing roles in this disclosure does not say, “I support no roles in this protocol.” It says, “I support the protocol but I’m providing no detail about specific roles.” Similar logic applies to any other omitted fields.



An empty disclosures array does not say, “I support no features that match your query.” It says, “I’m not disclosing to you that I support any features (that match your query).” An agent might not tell another that it supports a feature for various reasons, including: the trust that it imputes to the other party based on cumulative interactions so far, whether it’s in the middle of upgrading a plugin, whether it’s currently under high load, and so forth. And responses to a discover-features query are not guaranteed to be true forever; agents can be upgraded or downgraded, although they probably won’t churn in their feature profiles from moment to moment.



§

Privacy Considerations

Because the wildcards in a queries message can be very inclusive, the discover-features protocol could be used to mine information suitable for agent fingerprinting, in much the same way that browser fingerprinting works. This is antithetical to the ethos of our ecosystem, and represents bad behavior. Agents should use discover-features to answer legitimate questions, and not to build detailed profiles of one another. However, fingerprinting may be attempted anyway.



For agents that want to maintain privacy, several best practices are recommended:



§ Follow selective disclosure.

Only reveal supported features based on trust in the relationship. Even if you support a protocol, you may not wish to use it in every relationship. Don’t tell others about features you do not plan to use with them.



Patterns are easier to see in larger data samples. However, a pattern of ultra-minimal data is also a problem, so use good judgment about how forthcoming to be.



§ Vary the format of responses.

Sometimes, you might prettify your agent plaintext message one way, sometimes another.



§ Vary the order of items in the disclosures array.

If more than one key matches a query, do not always return them in alphabetical order or version order. If you do return them in order, do not always return them in ascending order.



§ Consider adding some spurious details.

If a query could match multiple features, then occasionally you might add some made-up features as matches. If a wildcard allows multiple versions of a protocol, then sometimes you might use some made-up versions. And sometimes not. (Doing this too aggressively might reveal your agent implementation, so use sparingly.)



§ Vary how you query, too.

How you ask questions may also be fingerprintable.



§

The Empty Message

Sometimes, only headers need to be communicated; there is no content for the body.



The PIURI for this protocol is:



https://didcomm.org/empty/1.0

The empty message has no semantic meaning. The message’s only purpose is to allow the transfer of message headers.



{

&nbsp; "type": "https://didcomm.org/empty/1.0/empty",

&nbsp; "id": "518be002-de8e-456e-b3d5-8fe472477a86",

&nbsp; "from": "did:example:123456",

&nbsp; "body": {}

}

§

Trust Ping Protocol 2.0

This protocol is a standard way for agents to test connectivity, responsiveness, and security of a DIDComm channel. It is analogous to the familiar ping command in networking — but because it operates over DIDComm, it is transport agnostic and asynchronous, and it can produce insights into privacy and security that a regular ping cannot.



The PIURI for this protocol is:



https://didcomm.org/trust-ping/2.0

§

Roles

There are two parties in a trust ping: the sender and the receiver. The sender initiates the trust ping. The receiver responds. If the receiver wants to do a ping of their own, they can, but this is a new interaction in which they become the sender.



§

Messages

§ ping

The trust ping interaction begins when sender creates a ping message like this:



{

&nbsp; "type": "https://didcomm.org/trust-ping/2.0/ping",

&nbsp; "id": "518be002-de8e-456e-b3d5-8fe472477a86",

&nbsp; "from": "did:example:123456",

&nbsp; "body": {

&nbsp;     "response\_requested": true

&nbsp; }

}

response\_requested: default value is true. If false, the sender is not requesting a ping-response from the receiver. If true, the sender is requesting a response.



§ ping-response

When the message arrives at the receiver, assuming that response\_requested is not false, the receiver should reply as quickly as possible with a ping-response message that looks like this:



{

&nbsp; "type": "https://didcomm.org/trust-ping/2.0/ping-response",

&nbsp; "id": "e002518b-456e-b3d5-de8e-7a86fe472847",

&nbsp; "thid": "518be002-de8e-456e-b3d5-8fe472477a86"

}

§

Trust

This is the “trust ping protocol”, not just the “ping protocol.” The “trust” in its name comes from several features that the interaction gains by virtue of the properties of the DIDComm messages. A ping and response verify to both parties that the necessary encryption is in place and working properly for the messages to be understood.



§

Internationalization (i18n)

Because automation makes life easier for humans, the data in DIDComm messages is usually assumed to have software as its audience. However, sometimes humans should see part of the data in a DIDComm message. For example, if the high-level application protocol running atop DIDComm is a kind of rich chat, humans may not see message headers and the details of threads — but they will want to read the text sent to them by a friend. Similarly, humans may need to read error messages or terms and conditions in their natural language.



DIDComm offers simple i18n features to address this need. They are intended to impose no up-front design burden on protocol implementers; multi-language support can be added once a protocol has adoption, with very little effort. These features also degrade gracefully and without coordination. Any party can introduce them to an interaction, but if others do not understand or support them, or if parties to the protocol have no human language in common, the interaction is typically still viable. (A protocol that inherently requires multilanguage support — e.g., to provides close captioning in second language — is the only exception.)



§

Internationalized by default

The default assumption about every field in a DIDComm message is that it is locale-independent (internationalized) already. Since number representation is governed by JSON syntax, and dates are represented as seconds-since-epoch or as ISO/IETF 3339 strings, this assumption is automatically true for data types that are not strings.



All string values in DIDComm messages are encoded as UTF-8, which is capable of representing the full Unicode character inventory. However, the default assumption for every string field in DIDComm also MUST be that it is locale-independent. This is appropriate for headers like id and type, for fields that contain URIs, and so forth.



§

accept-lang

header

For string values that are language-specific, any party in a DIDComm interaction MAY declare the human languages that they prefer by using the accept-lang header. This allows those who send them messages to localize the content appropriately.



The value of this header is an array of IANA’s language codes, ranked from most to least preferred. Once a language preference has been set, it MUST be assumed to apply until it is changed, or for the duration of an application-level protocol instance (a DIDComm thread) — whichever comes first. Parties who see this header MAY assume it is an appropriate default for future interactions as well. However, they MUST NOT apply the assumption to any other interactions that are already underway, as this would allow one protocol to trigger unpredictable side effects in another.



§

lang

header

When a sender is preparing a message that contains language-specific fields, they SHOULD clarify how to interpret those fields by using the lang header. This is a general best practices. Individual protocols that have strong dependencies on human language MAY require this header in contexts they govern.



Ideally, the value of lang will derive from a previously-seen accept-lang header, reflecting the fact that the sender is communicating in a language that the recipient prefers. (The sender could get matching language content by looking it up in message tables, calling a machine translation service, or — if the content is generated dynamically by a human — simply asking the human sender to speak or write in the target language.) However, even when no match is achieved, declaring lang lets the recipient call a machine translation service or take other intelligent action.



This header works much like lang in HTML, and its value comes from IANA’s language subtag registry. If this header is present, then any string field inside body that contains human-readable text (according to the active protocol’s definition of the message type) MUST hold text in the identified language.



§

i18n example

Suppose a chess protocol allows players to include human-friendly comments with their moves. At the beginning of the chess game, Bob includes a message that contains this header:



"accept-lang": \["fr", "en"]

This tells Alice that Bob prefers to interact in French, with English as a backup preference.



When Alice puts Bob in checkmate, assuming she has the desire and ability to honor Bob’s preference, her message might look like this:



{

&nbsp; "id": "388d599a-fdc1-4890-b32a-be6cd3893564",

&nbsp; "type": "https://didcomm.org/chess/1.0/move",

&nbsp; "lang": "fr",

&nbsp; "body": {

&nbsp;   "move": "BC4#",

&nbsp;   "comment": "C'est échec et mat, mon pote."

&nbsp; }

}

On the other hand, if Alice is unable to send French text, her message might contain "lang": "en" and "comment": "That's checkmate, buddy." Even though this comment is not in the language Bob prefers, at least Bob knows what language it is in.



§

Asking for a different

lang

What if Alice doesn’t support any of the languages in Bob’s accept-lang header — or if Bob never used such a header in the first place?



Bob MAY tell Alice that the language she used is problematic by sending her a problem report where the code field is w.msg.bad-lang. (In some protocols where language-specific fields may be vital rather than incidental, a problem like this might be an error instead of a warning; in such cases, the code MUST be e.msg.bad-lang instead.) Bob may include an accept-lang header on this problem-report message, teaching Alice what it will take to fix the problem.



§

Advanced i18n patterns

When protocols have i18n needs that are more advanced than this, a DIDComm extension such as the l10n extension is recommended.



§

Future-Proofing

§

Versioning

This version of the standard is known as “DIDComm v2” — acknowledging the fact that a v1 generation of DIDComm specs was incubated under the Hyperledger Aries project umbrella. The v1 specs are close conceptual cousins, but use a slightly different encryption envelope, and base their plaintext format on arbitrary JSON instead of JWMs.



Future evolutions of the spec will follow semver conventions. Minor updates that add features without breaking compatibility will carry a minor version number update: 2.1, 2.2, and so forth. Breaking changes will prompt a major version change.



§

Extensions

The general mechanism for DIDComm extensibility is the development of DIDComm protocols. In the case where extensibility requires a modification to the base DIDComm spec itself, a DIDComm extension is to be used. An extension adds a self-contained set of conventions or features. Support for DIDComm extensions is optional.



Each DIDComm extension is described in a specification of its own. Software that implements a DIDComm Extension in addition to the DIDComm spec will indicate so via link to the extension spec.



§

Future Work

§

Additional Encodings

DIDComm messages are JSON encoded (based on the JOSE family of specs) at the encryption, signature, and content level. Future encodings might introduce binary serializations. Each innovation like this MUST specify a deterministic and reliable method for indicating the alternative encoding used.



At multiple points in the creation of this spec the community discussed switching to CBOR as a primary encoding format to replace JSON. Two reasons prevented that switch: The maturity of the JSON related standards as compared to CBOR related standards, and the cost of switching so late in spec development.



§

Beyond Messaging

This is a DIDComm messaging spec. Security, privacy, routing, and metadata concepts from this spec could be adapted to other communication styles, including multicast/broadcast and streaming. This will create sister specs to DIDComm Messaging, rather than evolving DIDComm Messaging itself.



§

Post-Quantum Crypto

The designers of DIDComm are aware that DIDComm’s cryptographic methods will need to be upgraded when quantum computing matures. This is because DIDComm makes heavy use of asymmetric elliptic curve mechanisms that depend on the discrete logarithm problem; this computational hardness is known to be vulnerable to a quantum computer that can run Shor’s algorithm. Similar risks will drive upgrades to TLS, Ethereum, Bitcoin, and many other systems that are considered highly secure today.



Some modest preparations for quantum-resistant DIDComm have already begun. DIDComm is able to use arbitrary DID methods, which should allow approaches that are quantum-secure without changing the general pattern of DIDComm’s interaction with key management technology.



Libraries that provide quantum-resistant algorithms for signing and encryption are now available, but research is needed to determine which approaches are worthy of broad adoption. This is the subject of an ongoing project sponsored by NIST, and of a similar project in the EU.



We expect to update the DIDComm Messaging spec as these projects release mature recommendations and the cryptographic libraries they vet achieve adoption.

