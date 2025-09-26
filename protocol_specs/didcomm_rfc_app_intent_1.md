# DIDComm RFC — App-Intent 1.0: Action-Typed Inter-Application Requests (Paired Responses)

**Status:** Draft
**Type:** Standards Track
**Version:** 1.0-draft (action-typed + paired responses)
**Editors:** *TBD*
**Created:** 2025-09-11
**Depends On:** DIDComm v2; Discover-Features 2.0; Attachments 2.0

*This revision turns every action into a request/response **pair** of message types (PIURIs). It is a clean specification (no change-log), based on your draft. *

---

## 1. Summary

App-Intent 1.0 defines a small, composable DIDComm v2 protocol that lets one agent request another agent to perform a concrete action (e.g., share content, compose an email, pick a file, dial a number, capture media, scan a QR, add a calendar event, pay, sign). Each action is now represented by **two** message types:

* an **action-specific request** (e.g., `…/share-request`), and
* an **action-specific response** (e.g., `…/share-response`) that carries the action’s result.

The protocol is transport-agnostic and uses standard DIDComm threading, timing, and problem-reporting.

---

## 2. Motivation & Non-Goals

Modern apps benefit from intent semantics: a Caller states **what** to do with optional parameters; a Provider chooses **how**, subject to policy and user consent. This RFC standardizes interoperable message types and shared schemas so wallets, agents, and apps can compose intentful UX over DIDComm.

**Non-goals:** redefining file transfer (see §12 for composition with Media-Sharing), defining a permission system, or mandating UI. This RFC standardizes messages and expectations; consent and policy enforcement are implementation responsibilities.

---

## 3. Roles

* **Caller** — The agent initiating an action.
* **Provider** — The agent capable of fulfilling the action.
* **Chooser** (optional) — Helps select among multiple Providers.

---

## 4. Conventions

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as described in RFC 2119. All messages in this RFC are DIDComm v2 messages and may use standard decorators (e.g., `~thread`, `~timing`, `~please_ack`).

---

## 5. Message Family

**PIURI base:**

```
https://didcomm.org/app-intent/1.0/
```

### 5.1 Action **Request** Message Types

Each action is represented by its **own request** message type under the family above (examples):

```
<base_uri>/share-request
<base_uri>/compose-email-request
<base_uri>/dial-call-request
<base_uri>/open-url-request
<base_uri>/pick-file-request
<base_uri>/pick-contact-request
<base_uri>/pick-datetime-request
<base_uri>/pick-location-request
<base_uri>/capture-photo-request
<base_uri>/capture-video-request
<base_uri>/capture-audio-request
<base_uri>/scan-qr-request
<base_uri>/scan-document-request
<base_uri>/open-map-navigation-request
<base_uri>/add-calendar-event-request
<base_uri>/add-contact-request
<base_uri>/save-to-request
<base_uri>/print-request
<base_uri>/translate-request
<base_uri>/pay-request
<base_uri>/sign-request
<base_uri>/verify-signature-request
<base_uri>/encrypt-request
<base_uri>/decrypt-request
```

Providers advertise support for *request* message types during feature discovery (see §6).

### 5.2 Action **Response** Message Types (Paired)

Each request has a **paired response** message type that MUST be used to return the terminal result:

```
<base_uri>/share-response
<base_uri>/compose-email-response
<base_uri>/dial-call-response
<base_uri>/open-url-response
<base_uri>/pick-file-response
<base_uri>/pick-contact-response
<base_uri>/pick-datetime-response
<base_uri>/pick-location-response
<base_uri>/capture-photo-response
<base_uri>/capture-video-response
<base_uri>/capture-audio-response
<base_uri>/scan-qr-response
<base_uri>/scan-document-response
<base_uri>/open-map-navigation-response
<base_uri>/add-calendar-event-response
<base_uri>/add-contact-response
<base_uri>/save-to-response
<base_uri>/print-response
<base_uri>/translate-response
<base_uri>/pay-response
<base_uri>/sign-response
<base_uri>/verify-signature-response
<base_uri>/encrypt-response
<base_uri>/decrypt-response
```

**Naming rule:** replace `-request` with `-response` for the same action label.
**Schema rule:** the response body’s `result` member MUST validate against that action’s **result** schema in §13.

### 5.3 Common Control Message Types

* `<base_uri>/decline` — Provider refusal, with reason (non-terminal for thread reuse is allowed, but typically terminal).
* `<base_uri>/progress` — Optional progress updates.
* `<base_uri>/cancel` — Caller cancellation while in-flight.

> **Note:** The former generic `accept` message is replaced by action-specific `*-response` types.

---

## 6. Feature Discovery

Use **discover-features 2.0**. Providers advertise support for specific **request message types** using a feature where `feature_type: "message-type"`, `id` equals the *request* PIURI they support (e.g., `https://didcomm.org/app-intent/1.0/share-request`), and `roles` includes `"provider"`. Chooser implementations MAY advertise the role `"chooser"`. Callers query by PIURI (or prefix) and then address requests directly to a selected Provider DID.

---

## 7. Protocol Overview

App-Intent messages are **point-to-point**, **signed and encrypted** DIDComm messages within a thread.

1. **Discover** providers for action request types.
2. **Request:** Caller sends an **action-specific request** (e.g., `<base_uri>/share-request`) to a selected Provider DID.
3. **Consent & Execution:** Provider consults policy and obtains user consent.
4. **Progress** (optional): Provider emits `<base_uri>/progress` updates.
5. **Result:** Provider replies with the **action-specific response** (e.g., `<base_uri>/share-response`).
6. **Cancel** (optional): Caller MAY abort with `<base_uri>/cancel` while still in progress.

Errors use DIDComm `problem-report`.

---

## 8. Common Requirements & Decorators

All messages in this family:

* **MUST** include `~thread.thid`. For composition with other protocols, use `pthid` as appropriate.
* **SHOULD** include `~timing` with `created_time` and/or `expires_time`; Providers **MUST** reject stale requests.
* **MUST** be signed and encrypted for point-to-point delivery.
* **MAY** use `~please_ack`; Providers **SHOULD** implicitly acknowledge via the terminal **response**.

---

## 9. Message Semantics

### 9.1 Action Request (Caller → Provider)

Each action has its own **request** message type. All action requests share the following **normative body shape** and semantics:

**Security:** MUST be signed and encrypted (SE).
**Threading:** MUST include `~thread.thid`.

**Body (normative template):**

```json
{
  "params": { /* action-specific (see §13) */ },
  "constraints": {
    "accepts": ["<mime>", "<mime>"],
    "max_total_bytes": 16777216,
    "must_prompt_user": true,
    "require_user_presence": true
  },
  "display": {
    "title": "<string>",
    "subtitle": "<string>",
    "icon": { "mime": "<mime>", "data": "<base64>" }
  },
  "return": {
    "expect": "result|none",
    "deadline_ms": 15000,
    "progress": true
  },
  "origin": {
    "origin": "<human-readable origin or identifier>",
    "proof": { "alg": "<jws-alg>", "jws": "<compact-or-json>" }
  },
  "ttl_ms": 60000,
  "idempotency_key": "<opaque string>"
}
```

**Attachments:** MAY include DIDComm attachments. For large/streaming data, compose with Media-Sharing (§12).

**Validation:** Providers **MUST** reject requests whose parameters violate schema or supplied `constraints`.

> The requested action is encoded by the **message type** (e.g., `<base_uri>/share-request`).

### 9.2 Action Response (Provider → Caller)

Indicates approval and (optionally) completion **for that action**.

**Message type:** `<base_uri>/<action>-response`
**Security:** SE.
**Threading:** MUST include `~thread.thid` of the request.

**Body (normative template):**

```json
{
  "status": "ok",
  "result": { /* MUST validate against §13 <action>/result schema */ },
  "receipt": {
    "provider_txn_id": "<string>",
    "completed_at": "<RFC3339>"
  }
}
```

If the action produces **no result**, `result` MAY be omitted and `status` remains `"ok"`.

### 9.3 `app-intent/1.0/decline` (Provider → Caller)

**Security:** SE.
**Body:**

```json
{
  "reason": "user_declined|not_supported|invalid_params|rate_limited|busy|forbidden|timeout",
  "detail": "<string>",
  "retry_after_ms": 30000
}
```

### 9.4 `app-intent/1.0/progress` (Provider → Caller) — OPTIONAL

**Security:** SE.
**Body:**

```json
{ "stage": "<string>", "percent": 42, "message": "<string>" }
```

### 9.5 `app-intent/1.0/cancel` (Caller → Provider) — OPTIONAL

**Security:** SE.
**Body:**

```json
{ "reason": "user_cancelled|superseded|timeout" }
```

### 9.6 Error Handling — `problem-report`

Recommended `code` values:

* `app-intent/request/invalid`
* `app-intent/request/unsupported-message-type`
* `app-intent/policy/forbidden`
* `app-intent/rate-limited`
* `app-intent/timeout`

---

## 10. Action Catalog (v1)

This catalog lists **request/response pairs**. Each entry defines semantics and references **params/result** schemas in §13. Providers advertise support for *request* types in discover-features.

**Consent tiers:** **L** (low), **M** (medium), **H** (high).

| Request Type                             | Response Type                             | Summary                           | Consent |
| ---------------------------------------- | ----------------------------------------- | --------------------------------- | :-----: |
| `<base_uri>/share-request`               | `<base_uri>/share-response`               | Share text/URLs/small files.      |    M    |
| `<base_uri>/compose-email-request`       | `<base_uri>/compose-email-response`       | Compose or send an email.         |    H    |
| `<base_uri>/dial-call-request`           | `<base_uri>/dial-call-response`           | Initiate a phone/VoIP call.       |    H    |
| `<base_uri>/open-url-request`            | `<base_uri>/open-url-response`            | Open a URL to view or edit.       |    M    |
| `<base_uri>/pick-file-request`           | `<base_uri>/pick-file-response`           | User picks file(s).               |    M    |
| `<base_uri>/pick-contact-request`        | `<base_uri>/pick-contact-response`        | User picks contact(s).            |    M    |
| `<base_uri>/pick-datetime-request`       | `<base_uri>/pick-datetime-response`       | User picks a date/time or range.  |    L    |
| `<base_uri>/pick-location-request`       | `<base_uri>/pick-location-response`       | User picks a geographic location. |    M    |
| `<base_uri>/capture-photo-request`       | `<base_uri>/capture-photo-response`       | Capture a still photo.            |    H    |
| `<base_uri>/capture-video-request`       | `<base_uri>/capture-video-response`       | Capture video.                    |    H    |
| `<base_uri>/capture-audio-request`       | `<base_uri>/capture-audio-response`       | Record audio.                     |    H    |
| `<base_uri>/scan-qr-request`             | `<base_uri>/scan-qr-response`             | Scan QR/Barcode.                  |    M    |
| `<base_uri>/scan-document-request`       | `<base_uri>/scan-document-response`       | Scan/deskew document.             |    M    |
| `<base_uri>/open-map-navigation-request` | `<base_uri>/open-map-navigation-response` | Launch navigation.                |    M    |
| `<base_uri>/add-calendar-event-request`  | `<base_uri>/add-calendar-event-response`  | Add/update a calendar event.      |    H    |
| `<base_uri>/add-contact-request`         | `<base_uri>/add-contact-response`         | Add/update a contact.             |    H    |
| `<base_uri>/save-to-request`             | `<base_uri>/save-to-response`             | Save bytes to a location.         |    M    |
| `<base_uri>/print-request`               | `<base_uri>/print-response`               | Print via a provider.             |    M    |
| `<base_uri>/translate-request`           | `<base_uri>/translate-response`           | Translate text or a document.     |    L    |
| `<base_uri>/pay-request`                 | `<base_uri>/pay-response`                 | Authorize/execute a payment.      |    H    |
| `<base_uri>/sign-request`                | `<base_uri>/sign-response`                | Produce a digital signature.      |    H    |
| `<base_uri>/verify-signature-request`    | `<base_uri>/verify-signature-response`    | Verify a signature.               |    L    |
| `<base_uri>/encrypt-request`             | `<base_uri>/encrypt-response`             | Encrypt a payload.                |    H    |
| `<base_uri>/decrypt-request`             | `<base_uri>/decrypt-response`             | Decrypt a payload.                |    H    |

---

## 11. Broadcast & Confidentiality

Broadcast of *requests* to unknown recipients is **NOT RECOMMENDED**. Callers SHOULD discover Providers first, then address a request directly. If broadcast is unavoidable, request bodies MUST contain no secrets; Providers MUST reply privately to the Caller DID using the **action-specific response**. Discovery itself (queries/disclose) is handled by discover-features 2.0.

---

## 12. Composition with Media-Sharing 1.0

For large or streaming data, agents SHOULD compose with **Media-Sharing 1.0** within the same conversation by setting `~thread.pthid` to the original request’s `thid`. The terminal app-intent outcome is the **action-specific response** (e.g., `…/share-response`), not a generic accept/ack.

---

## 13. JSON Schemas — **Actions** (Normative)

All schemas use JSON Schema 2020-12. `$id` values are stable identifiers suitable for citation. Unless noted, `additionalProperties` is **false**. The `$id` layout is:

```
https://didcomm.org/app-intent/1.0/actions/<action>/{params|result}.schema.json
```

**Rule:** For a given `<action>`, the **request** body MUST validate its `params` against `<action>/params.schema.json`. The **response** body’s `result` MUST validate against `<action>/result.schema.json`.

### 13.1 **share**

**Params** — `$id: https://didcomm.org/app-intent/1.0/actions/share/params.schema.json`

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/share/params.schema.json","type":"object","properties":{"title":{"type":"string"},"text":{"type":"string"},"urls":{"type":"array","items":{"type":"string","format":"uri"}},"items":{"type":"array","items":{"type":"object","required":["attachment_id"],"properties":{"attachment_id":{"type":"string"},"description":{"type":"string"}},"additionalProperties":false}}},"additionalProperties":false}
```

**Result** — `$id: https://didcomm.org/app-intent/1.0/actions/share/result.schema.json`

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/share/result.schema.json","type":"object","properties":{"delivered":{"type":"boolean"},"provider_message_id":{"type":"string"},"channel":{"type":"string","enum":["email","sms","social","clipboard","other"]}},"required":["delivered"],"additionalProperties":false}
```

### 13.2 **compose-email**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/compose-email/params.schema.json","type":"object","properties":{"to":{"type":"array","items":{"type":"string"}},"cc":{"type":"array","items":{"type":"string"}},"bcc":{"type":"array","items":{"type":"string"}},"subject":{"type":"string"},"body":{"type":"string"},"content_type":{"type":"string","enum":["text/plain","text/html"]},"attachments":{"type":"array","items":{"type":"object","required":["attachment_id"],"properties":{"attachment_id":{"type":"string"},"description":{"type":"string"}},"additionalProperties":false}},"send_immediately":{"type":"boolean","default":false}},"required":["to"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/compose-email/result.schema.json","type":"object","oneOf":[{"required":["sent"]},{"required":["draft_saved"]}],"properties":{"sent":{"type":"boolean"},"draft_saved":{"type":"boolean"},"message_id":{"type":"string"}},"additionalProperties":false}
```

### 13.3 **dial-call**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/dial-call/params.schema.json","type":"object","properties":{"phone_number":{"type":"string"},"call_type":{"type":"string","enum":["voice","video"]},"prompt_before_dial":{"type":"boolean","default":true}},"required":["phone_number"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/dial-call/result.schema.json","type":"object","properties":{"initiated":{"type":"boolean"},"connection_state":{"type":"string","enum":["ringing","connected","failed"]},"reason":{"type":"string"}},"required":["initiated"],"additionalProperties":false}
```

### 13.4 **open-url**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/open-url/params.schema.json","type":"object","properties":{"url":{"type":"string","format":"uri"},"disposition":{"type":"string","enum":["view","edit","embed","open-external"]},"target":{"type":"string","enum":["app","system","browser","chooser"],"default":"app"},"referrer":{"type":"string"},"allow_insecure_redirects":{"type":"boolean","default":false}},"required":["url"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/open-url/result.schema.json","type":"object","properties":{"opened":{"type":"boolean"},"handler":{"type":"string"},"reason":{"type":"string"}},"required":["opened"],"additionalProperties":false}
```

### 13.5 **pick-file**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pick-file/params.schema.json","type":"object","properties":{"accepts":{"type":"array","items":{"type":"string"}},"multiple":{"type":"boolean","default":false},"directories":{"type":"boolean","default":false},"max_total_bytes":{"type":"integer","minimum":0},"include_data":{"type":"boolean","default":false}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pick-file/result.schema.json","type":"object","properties":{"files":{"type":"array","items":{"type":"object","required":["name"],"properties":{"attachment_id":{"type":"string"},"name":{"type":"string"},"size_bytes":{"type":"integer","minimum":0},"mime":{"type":"string"}},"additionalProperties":false}}},"required":["files"],"additionalProperties":false}
```

### 13.6 **pick-contact**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pick-contact/params.schema.json","type":"object","properties":{"multiple":{"type":"boolean","default":false},"fields":{"type":"array","items":{"type":"string","enum":["name","organization","emails","phones","addresses","notes","avatar"]}},"query":{"type":"string"}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pick-contact/result.schema.json","type":"object","properties":{"contacts":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"organization":{"type":"string"},"emails":{"type":"array","items":{"type":"string"}},"phones":{"type":"array","items":{"type":"string"}},"addresses":{"type":"array","items":{"type":"string"}},"notes":{"type":"string"},"avatar_attachment_id":{"type":"string"}},"additionalProperties":false}}},"required":["contacts"],"additionalProperties":false}
```

### 13.7 **pick-datetime**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pick-datetime/params.schema.json","type":"object","properties":{"mode":{"type":"string","enum":["date","time","datetime","range"],"default":"datetime"},"timezone":{"type":"string"},"min":{"type":"string","format":"date-time"},"max":{"type":"string","format":"date-time"},"step_minutes":{"type":"integer","minimum":1}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pick-datetime/result.schema.json","type":"object","oneOf":[{"required":["value"]},{"required":["range"]}],"properties":{"value":{"type":"string","format":"date-time"},"range":{"type":"object","required":["start","end"],"properties":{"start":{"type":"string","format":"date-time"},"end":{"type":"string","format":"date-time"}},"additionalProperties":false}},"additionalProperties":false}
```

### 13.8 **pick-location**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pick-location/params.schema.json","type":"object","properties":{"initial":{"type":"object","properties":{"lat":{"type":"number"},"lon":{"type":"number"}},"additionalProperties":false},"require_geocoding":{"type":"boolean","default":true}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pick-location/result.schema.json","type":"object","properties":{"lat":{"type":"number"},"lon":{"type":"number"},"address":{"type":"string"},"place_name":{"type":"string"}},"required":["lat","lon"],"additionalProperties":false}
```

### 13.9 **capture-photo**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/capture-photo/params.schema.json","type":"object","properties":{"camera":{"type":"string","enum":["front","rear"]},"quality":{"type":"integer","minimum":1,"maximum":100,"default":92},"format":{"type":"string","enum":["image/jpeg","image/png","image/heic"],"default":"image/jpeg"},"max_size_bytes":{"type":"integer","minimum":0},"allow_edit":{"type":"boolean","default":false}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/capture-photo/result.schema.json","type":"object","properties":{"attachment_id":{"type":"string"},"width":{"type":"integer","minimum":1},"height":{"type":"integer","minimum":1},"mime":{"type":"string"},"size_bytes":{"type":"integer","minimum":0}},"required":["attachment_id","mime"],"additionalProperties":false}
```

### 13.10 **capture-video**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/capture-video/params.schema.json","type":"object","properties":{"camera":{"type":"string","enum":["front","rear"]},"max_duration_seconds":{"type":"integer","minimum":1},"quality":{"type":"string","enum":["low","medium","high"],"default":"high"},"mime":{"type":"string","enum":["video/mp4","video/webm"],"default":"video/mp4"}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/capture-video/result.schema.json","type":"object","properties":{"attachment_id":{"type":"string"},"duration_seconds":{"type":"integer","minimum":0},"width":{"type":"integer","minimum":1},"height":{"type":"integer","minimum":1},"size_bytes":{"type":"integer","minimum":0},"mime":{"type":"string"}},"required":["attachment_id","mime"],"additionalProperties":false}
```

### 13.11 **capture-audio**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/capture-audio/params.schema.json","type":"object","properties":{"max_duration_seconds":{"type":"integer","minimum":1},"sample_rate_hz":{"type":"integer","minimum":8000},"channels":{"type":"integer","enum":[1,2],"default":1},"mime":{"type":"string","enum":["audio/webm","audio/mpeg","audio/wav"],"default":"audio/webm"}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/capture-audio/result.schema.json","type":"object","properties":{"attachment_id":{"type":"string"},"duration_seconds":{"type":"integer","minimum":0},"size_bytes":{"type":"integer","minimum":0},"mime":{"type":"string"}},"required":["attachment_id","mime"],"additionalProperties":false}
```

### 13.12 **scan-qr**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/scan-qr/params.schema.json","type":"object","properties":{"formats":{"type":"array","items":{"type":"string","enum":["qr","aztec","pdf417","code128","code39","ean13","upc"]}},"save_image":{"type":"boolean","default":false}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/scan-qr/result.schema.json","type":"object","properties":{"symbology":{"type":"string"},"text":{"type":"string"},"attachment_id":{"type":"string"}},"required":["symbology"],"additionalProperties":false}
```

### 13.13 **scan-document**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/scan-document/params.schema.json","type":"object","properties":{"pages":{"type":"integer","minimum":1,"default":1},"color_mode":{"type":"string","enum":["auto","color","grayscale","b&w"],"default":"auto"},"format":{"type":"string","enum":["image/jpeg","application/pdf"],"default":"application/pdf"},"deskew":{"type":"boolean","default":true}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/scan-document/result.schema.json","type":"object","oneOf":[{"required":["pdf"]},{"required":["images"]}],"properties":{"pdf":{"type":"object","required":["attachment_id"],"properties":{"attachment_id":{"type":"string"}},"additionalProperties":false},"images":{"type":"array","items":{"type":"object","required":["attachment_id"],"properties":{"attachment_id":{"type":"string"},"mime":{"type":"string"}},"additionalProperties":false}}},"additionalProperties":false}
```

### 13.14 **open-map-navigation**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/open-map-navigation/params.schema.json","type":"object","properties":{"destination":{"type":"object","required":["lat","lon"],"properties":{"lat":{"type":"number"},"lon":{"type":"number"}},"additionalProperties":false},"label":{"type":"string"},"transport_mode":{"type":"string","enum":["driving","walking","transit","cycling"],"default":"driving"},"avoid":{"type":"array","items":{"type":"string","enum":["tolls","ferries","highways"]}}},"required":["destination"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/open-map-navigation/result.schema.json","type":"object","properties":{"launched":{"type":"boolean"},"provider":{"type":"string"}},"required":["launched"],"additionalProperties":false}
```

### 13.15 **add-calendar-event**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/add-calendar-event/params.schema.json","type":"object","properties":{"summary":{"type":"string"},"description":{"type":"string"},"start":{"type":"string","format":"date-time"},"end":{"type":"string","format":"date-time"},"timezone":{"type":"string"},"location":{"type":"string"},"attendees":{"type":"array","items":{"type":"string"}},"reminders":{"type":"array","items":{"type":"object","required":["minutes"],"properties":{"minutes":{"type":"integer","minimum":0},"method":{"type":"string","enum":["default","popup","email"],"default":"default"}},"additionalProperties":false}}},"required":["summary","start","end"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/add-calendar-event/result.schema.json","type":"object","properties":{"created":{"type":"boolean"},"event_id":{"type":"string"},"calendar_id":{"type":"string"}},"required":["created"],"additionalProperties":false}
```

### 13.16 **add-contact**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/add-contact/params.schema.json","type":"object","properties":{"name":{"type":"string"},"organization":{"type":"string"},"emails":{"type":"array","items":{"type":"string"}},"phones":{"type":"array","items":{"type":"string"}},"addresses":{"type":"array","items":{"type":"string"}},"notes":{"type":"string"},"avatar_attachment_id":{"type":"string"}},"required":["name"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/add-contact/result.schema.json","type":"object","properties":{"created":{"type":"boolean"},"contact_id":{"type":"string"}},"required":["created"],"additionalProperties":false}
```

### 13.17 **save-to**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/save-to/params.schema.json","type":"object","properties":{"attachment_id":{"type":"string"},"mime":{"type":"string"},"suggested_filename":{"type":"string"},"suggested_location":{"type":"string"},"overwrite":{"type":"boolean","default":false}},"required":["attachment_id"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/save-to/result.schema.json","type":"object","properties":{"saved":{"type":"boolean"},"uri":{"type":"string","format":"uri"},"path":{"type":"string"}},"required":["saved"],"additionalProperties":false}
```

### 13.18 **print**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/print/params.schema.json","type":"object","properties":{"attachment_id":{"type":"string"},"mime":{"type":"string"},"copies":{"type":"integer","minimum":1,"default":1},"color":{"type":"string","enum":["auto","color","monochrome"],"default":"auto"},"orientation":{"type":"string","enum":["auto","portrait","landscape"],"default":"auto"},"duplex":{"type":"string","enum":["simplex","long-edge","short-edge"],"default":"simplex"},"dpi":{"type":"integer","minimum":72},"paper_size":{"type":"string"}},"required":["attachment_id"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/print/result.schema.json","type":"object","properties":{"queued":{"type":"boolean"},"job_id":{"type":"string"},"printer":{"type":"string"}},"required":["queued"],"additionalProperties":false}
```

### 13.19 **translate**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/translate/params.schema.json","type":"object","oneOf":[{"required":["text"]},{"required":["attachment_id"]}],"properties":{"text":{"type":"string"},"attachment_id":{"type":"string"},"source_lang":{"type":"string"},"target_lang":{"type":"string"}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/translate/result.schema.json","type":"object","oneOf":[{"required":["text"]},{"required":["attachment_id"]}],"properties":{"text":{"type":"string"},"attachment_id":{"type":"string"}},"additionalProperties":false}
```

### 13.20 **pay**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pay/params.schema.json","type":"object","properties":{"amount":{"type":"object","required":["currency","value"],"properties":{"currency":{"type":"string","minLength":3,"maxLength":3},"value":{"type":"string"}},"additionalProperties":false},"payee":{"type":"object","properties":{"name":{"type":"string"},"id":{"type":"string"}},"additionalProperties":false},"method":{"type":"string","enum":["card","bank","wallet","crypto"]},"reference":{"type":"string"},"require_sca":{"type":"boolean","default":true}},"required":["amount"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/pay/result.schema.json","type":"object","properties":{"status":{"type":"string","enum":["authorized","captured","declined","failed","pending"]},"txn_id":{"type":"string"},"reason":{"type":"string"}},"required":["status"],"additionalProperties":false}
```

### 13.21 **sign**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/sign/params.schema.json","type":"object","oneOf":[{"required":["payload_base64"]},{"required":["payload_attachment_id"]}],"properties":{"payload_base64":{"type":"string"},"payload_attachment_id":{"type":"string"},"alg":{"type":"string"},"format":{"type":"string","enum":["jws","cose","raw"],"default":"jws"},"key_ref":{"type":"string"},"protected_headers":{"type":"object","additionalProperties":true}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/sign/result.schema.json","type":"object","properties":{"format":{"type":"string","enum":["jws","cose","raw"]},"value":{"type":"string"},"kid":{"type":"string"}},"required":["format","value"],"additionalProperties":false}
```

### 13.22 **verify-signature**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/verify-signature/params.schema.json","type":"object","properties":{"format":{"type":"string","enum":["jws","cose","raw"]},"value":{"type":"string"},"payload_base64":{"type":"string"},"payload_attachment_id":{"type":"string"},"alg":{"type":"string"},"public_key_jwk":{"type":"object","additionalProperties":true},"signer":{"type":"string"}},"required":["format","value"],"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/verify-signature/result.schema.json","type":"object","properties":{"verified":{"type":"boolean"},"reason":{"type":"string"},"header_claims":{"type":"object","additionalProperties":true},"signer":{"type":"string"}},"required":["verified"],"additionalProperties":false}
```

### 13.23 **encrypt**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/encrypt/params.schema.json","type":"object","oneOf":[{"required":["payload_base64"]},{"required":["payload_attachment_id"]}],"properties":{"payload_base64":{"type":"string"},"payload_attachment_id":{"type":"string"},"alg":{"type":"string"},"recipients":{"type":"array","items":{"type":"object","oneOf":[{"required":["did_url"]},{"required":["jwk"]}],"properties":{"did_url":{"type":"string"},"jwk":{"type":"object","additionalProperties":true}},"additionalProperties":false}},"format":{"type":"string","enum":["jwe","cose","age"],"default":"jwe"}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/encrypt/result.schema.json","type":"object","properties":{"format":{"type":"string","enum":["jwe","cose","age"]},"ciphertext_base64":{"type":"string"},"attachment_id":{"type":"string"}},"oneOf":[{"required":["format","ciphertext_base64"]},{"required":["format","attachment_id"]}],"additionalProperties":false}
```

### 13.24 **decrypt**

**Params**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/decrypt/params.schema.json","type":"object","oneOf":[{"required":["ciphertext_base64"]},{"required":["attachment_id"]}],"properties":{"ciphertext_base64":{"type":"string"},"attachment_id":{"type":"string"},"alg":{"type":"string"},"key_ref":{"type":"string"}},"additionalProperties":false}
```

**Result**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://didcomm.org/app-intent/1.0/actions/decrypt/result.schema.json","type":"object","properties":{"payload_base64":{"type":"string"},"attachment_id":{"type":"string"}},"oneOf":[{"required":["payload_base64"]},{"required":["attachment_id"]}],"additionalProperties":false}
```

---

## 14. Security Considerations

* **Confidentiality & Integrity:** All non-discovery messages MUST be signed and encrypted. Providers MUST verify before acting.
* **User Consent:** Providers MUST obtain explicit approval for side-effectful actions (e.g., sending, dialing, capture, payment). Implementations SHOULD display Caller identity and a human-readable summary.
* **Replay Defense:** Providers MUST reject stale requests using `~timing` or `ttl_ms` guidance.
* **Origin Binding (optional):** If a Caller acts on behalf of a higher-level origin, an `origin.proof` SHOULD be included and verified.
* **Idempotency:** Providers SHOULD deduplicate by `(thid, idempotency_key)`.
* **Data Minimization:** Callers SHOULD avoid embedding large/sensitive bytes in `params` or inline attachments; use Media-Sharing.
* **Pairwise DIDs:** Agents SHOULD use pairwise DIDs to mitigate correlation.

---

## 15. Privacy Considerations

* **Capability Exposure:** Discovery may reveal installed capabilities. Gate with policy/consent; MAY rate-limit.
* **Least Disclosure:** Requests SHOULD convey only necessary parameters. Providers SHOULD filter/redact results.
* **Linkability:** Use new threads for independent intents; avoid reusing long-lived identifiers across unrelated contexts.

---

## 16. Versioning & Extensibility

Major versions are encoded in the PIURI. Backwards-incompatible changes bump the major. Providers MAY advertise support metadata in discovery (e.g., roles `provider:v1`). Minor/patch changes MUST NOT break existing valid messages.

**Caller MUST** send an **action-specific request** with SE and `~thread.thid`, provide schema-compliant `params`, and avoid broadcasting requests.
**Provider MUST** validate `params`, enforce replay protection, obtain consent, and send one terminal **action-specific response** or a `decline`.
**Chooser SHOULD** present candidates fairly and preserve `thid`.

---

## 17. IANA-Style Registry: Action Message Types

This RFC defines a living registry of **Action Message Type Pairs** under `https://didcomm.org/app-intent/1.0/`.

**Registration requirements:** A new action **MUST** specify: (1) a stable request PIURI; (2) a stable response PIURI (same label with `-response`); (3) precise description; (4) `params` and `result` schemas; (5) security & privacy notes; (6) examples.
**Update policy:** Backwards-incompatible changes MUST publish a new major (e.g., `<base_uri>/2.0/…`) and update discover-features metadata.
**Display metadata:** Providers MAY publish name/icon/summary in disclosures for chooser UX.

---

## 18. Examples (Non-Normative)

* **Share (small inline):** Caller → `<base_uri>/share-request` (image attachment `< 16 KB`) → Provider → `<base_uri>/share-response` with `{ "result": { "delivered": true } }`.
* **Share (large):** `<base_uri>/share-request` with metadata only → Media-Sharing flow (same conversation; `pthid` = request `thid`) → terminal `<base_uri>/share-response`.
* **Scan QR:** `<base_uri>/scan-qr-request` → `progress` ("waiting-user") → `<base_uri>/scan-qr-response` with `{ "result": { "text": "WIFI:S:…" } }`.

---

*End of specification.*
