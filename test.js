// Lightweight sanity checks for core SDK shapes (not full runtime tests)

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Resolve correctly whether running from repo root or from package dir
const pkgDirCandidate = path.join(process.cwd(), 'decent_app_sdk');
const rootDir = fs.existsSync(path.join(process.cwd(), 'src'))
  ? process.cwd()
  : (fs.existsSync(path.join(pkgDirCandidate, 'src')) ? pkgDirCandidate : process.cwd());
const fromRoot = (...segments) => path.join(rootDir, ...segments);
const toFileUrl = (p) => pathToFileURL(p).href;

const mustExist = [
  '.src/client/index.js',
  '.src/service-worker/index.js',
  '.src/protocols/base.js',
  '.src/protocols/registry.js',
  '.src/protocols/discover-features/index.js',
  '.src/protocols/app-intents/index.js',
];

const missing = mustExist.filter(p => !fs.existsSync(fromRoot(p)));
if (missing.length) {
  console.error('Missing required files:', missing);
  process.exit(1);
}

console.log('Basic file presence test passed.');


// Additional sanity checks for new config options and client API
try {
  const swIndex = fs.readFileSync(fromRoot('src', 'service-worker', 'index.js'), 'utf8');
  if (!/autoUnpack/.test(swIndex) || !/deliveryStrategy/.test(swIndex)) {
    console.error('initServiceWorker should support autoUnpack and deliveryStrategy.');
    process.exit(1);
  }
  const rpc = fs.readFileSync(fromRoot('src', 'service-worker', 'rpc.js'), 'utf8');
  if (!/threadId/.test(rpc) || !/deliveryStrategy/.test(rpc)) {
    console.error('RPC should handle threadId and deliveryStrategy.');
    process.exit(1);
  }
  const clientIndex = fs.readFileSync(fromRoot('src', 'client', 'index.js'), 'utf8');
  if (!/send\(dest, packed, threadId\)/.test(clientIndex)) {
    console.error('Client send() should accept threadId parameter.');
    process.exit(1);
  }
  console.log('Extended config and API shape checks passed.');
} catch (e) {
  console.error('Extended checks failed:', e?.message || e);
  process.exit(1);
}

// Runtime behavior tests (mocked SW environment)
try {
  const { initServiceWorker } = await import(toFileUrl(fromRoot('src', 'service-worker', 'index.js')));
  const { extractThreadId } = await import(toFileUrl(fromRoot('src', 'utils', 'message-helpers.js')));
  const responseHelpers = await import(toFileUrl(fromRoot('src', 'utils', 'response-helpers.js')));

  // Mock global self with required APIs
  const deliveries = [];
  const sent = [];
  const listeners = { delivery: [], message: [] };
  const windowClients = [];

  const fakeClient = (id) => ({ id: String(id), messages: [], postMessage(m) { this.messages.push(m); } });
  windowClients.push(fakeClient('c1'));
  windowClients.push(fakeClient('c2'));

  const selfMock = {
    addEventListener(type, fn) { (listeners[type] || (listeners[type] = [])).push(fn); },
    clients: { async matchAll() { return windowClients; } },
    async packMessage(dest, type, bodyJson) { return { success: true, error_code: 0, error: '', message: JSON.stringify({ dest, type, body: JSON.parse(bodyJson) }) }; },
    async unpackMessage(raw) {
      try { return { success: true, error_code: 0, error: '', message: typeof raw === 'string' ? raw : JSON.stringify(raw) }; } catch { return { success: false, error_code: -1, error: 'unpack failed', message: '' }; }
    },
    async sendMessage(dest, packed) { sent.push({ dest, packed }); return 'success'; },
    getDID: async () => ({ success: true, error_code: 0, error: '', did: 'did:example:123', did_document: '{}', public_key: 'pk' }),
    checkDidcommPermission: async () => true,
    checkMultipleDidcommPermissions: async () => [true, false],
    requestDidcommPermissions: async () => ({ success: true, grantedPermissions: [], failedProtocols: [] }),
    listGrantedDidcommPermissions: async () => [],
  };

  // Bind self global for the modules under test
  /** @type {any} */ (globalThis).self = selfMock;

  // 1) initServiceWorker thread+autoUnpack=false -> warns and forces true
  let warned = false;
  const origWarn = console.warn;
  console.warn = (...args) => { warned = true; origWarn.apply(console, args); };
  const registry1 = initServiceWorker({ deliveryStrategy: 'thread', autoUnpack: false, builtInProtocols: false });
  console.warn = origWarn;
  if (!warned) { console.error('Expected warning when autoUnpack=false with thread strategy'); process.exit(1); }

  // 2) Thread ID extraction for v2 and v1
  const v2Msg = { thid: 't-123', type: 'test', body: {} };
  const v1Msg = { '~thread': { thid: 't-456' }, type: 'test', body: {} };
  if (extractThreadId(v2Msg) !== 't-123') { console.error('extractThreadId failed for v2 thid'); process.exit(1); }
  if (extractThreadId(JSON.stringify(v1Msg)) !== 't-456') { console.error('extractThreadId failed for v1 ~thread.thid via string'); process.exit(1); }

  // 3) Map a threadId on send via RPC path
  const { registerRpcHandlers } = await import(toFileUrl(fromRoot('src', 'service-worker', 'rpc.js')));
  // Minimal registry with routeIncoming no-op for this test
  const registry = { async discoverFeatures() { return []; }, async advertiseFeature() {}, async discoverIntentProviders() { return []; }, async requestIntent() { return {}; }, async routeIncoming() {} };
  registerRpcHandlers({ registry, runtime: selfMock, logger: console, config: { deliveryStrategy: 'thread', autoUnpack: true } });

  // Simulate a message event for send()
  const messagePorts = [];
  const mkPort = () => ({ posts: [], postMessage(m) { this.posts.push(m); } });
  const port = mkPort();
  const evtSend = { data: { kind: 'send', data: { dest: 'did:x', packed: 'pkt', threadId: 'thr-A' }, port }, source: { id: 'c1' } };
  for (const fn of listeners.message) fn(evtSend);
  // Accept either raw RouterResult string 'success' or an { ok: true } envelope
  const sentPayload = port.posts[0];
  const sendOk = (typeof sentPayload === 'string') ? (sentPayload === 'success') : Boolean(sentPayload && sentPayload.ok);
  if (!sendOk) {
    console.error('RPC send did not reply with a success indication');
    process.exit(1);
  }

  // 4) Delivery event with unpacked message routes to matching client in thread mode
  const deliveryMsg = { type: 'x', body: {}, thid: 'thr-A' };
  const evtDelivery = { data: JSON.stringify(deliveryMsg) };
  for (const fn of listeners.delivery) await fn(evtDelivery);
  const targeted = windowClients[0].messages.find(m => m?.kind === 'incoming');
  if (!targeted || targeted.raw?.thid !== 'thr-A') { console.error('Thread delivery did not target mapped client'); process.exit(1); }

  // 5) Fallback to broadcast when mapping missing
  const evtDelivery2 = { data: JSON.stringify({ type: 'x', body: {}, thid: 'thr-NOMAP' }) };
  for (const fn of listeners.delivery) await fn(evtDelivery2);
  const b1 = windowClients[0].messages[windowClients[0].messages.length - 1];
  const b2 = windowClients[1].messages[windowClients[1].messages.length - 1];
  if (!(b1 && b2 && (b1.raw?.thid === 'thr-NOMAP') && (b2.raw?.thid === 'thr-NOMAP'))) {
    console.error('Broadcast fallback not observed for unmapped thread');
    process.exit(1);
  }

  // 6) Unpack vs raw: when autoUnpack=false, raw should be forwarded
  // Re-register handlers with autoUnpack=false and broadcast
  const listeners2 = { delivery: [] };
  const selfMock2 = {
    addEventListener(type, fn) { (listeners2[type] || (listeners2[type] = [])).push(fn); },
    clients: { async matchAll() { return windowClients; } },
    async unpackMessage(raw) { return { success: false }; },
  };
  // Clear client messages for clean assertion
  windowClients.forEach(c => { c.messages.length = 0; });
  registerRpcHandlers({ registry, runtime: selfMock2, logger: console, config: { deliveryStrategy: 'broadcast', autoUnpack: false } });
  const rawPayload = '{"hello":"world"}';
  for (const fn of (listeners2.delivery || [])) await fn({ data: rawPayload });
  if (!(windowClients[0].messages[0]?.raw === rawPayload && windowClients[1].messages[0]?.raw === rawPayload)) {
    console.error('Expected raw payload to be broadcast when autoUnpack=false');
    process.exit(1);
  }

  console.log('Runtime behavior tests passed.');

  // Response helper unit checks
  const helperTests = [
    { fn: 'isDIDSuccess', input: { success: true, error_code: 0, error: '', did: 'x' }, expected: true },
    { fn: 'isDIDSuccess', input: { success: false, error_code: 1, error: 'e' }, expected: false },
    { fn: 'isMessageOpSuccess', input: { success: true, error_code: 0, error: '', message: 'm' }, expected: true },
    { fn: 'isMessageOpSuccess', input: { success: false, error_code: 1, error: 'e' }, expected: false },
    { fn: 'isRouterSuccess', input: 'success', expected: true },
    { fn: 'isRouterSuccess', input: 'invalid-address', expected: false },
    { fn: 'isSuccess', input: 'success', expected: true },
    { fn: 'isSuccess', input: { success: true }, expected: true },
    { fn: 'isSuccess', input: { success: false }, expected: false },
  ];
  const helperFailures = helperTests.filter(t => t.expected !== responseHelpers[t.fn](t.input));
  if (helperFailures.length) {
    console.error('Response helper tests failed:', helperFailures);
    process.exit(1);
  }
  console.log('Response helper tests passed.');
} catch (e) {
  console.error('Runtime behavior tests failed:', e?.message || e);
  process.exit(1);
}

// Attachment utilities tests
try {
  const attachmentUtils = await import(toFileUrl(fromRoot('src', 'utils', 'attachments.js')));
  const { normalizeAttachment, validateAttachment, normalizeAttachments, validateAttachments } = attachmentUtils;

  // normalizeAttachment legacy conversions
  const n1 = normalizeAttachment({ mime_type: 'image/jpeg', data: { base64: 'AAAA' } });
  if (!(n1.mimeType === 'image/jpeg' && n1.data === 'AAAA' && !n1.externalUrl && n1.id)) {
    console.error('normalizeAttachment failed for legacy base64');
    process.exit(1);
  }
  const n2 = normalizeAttachment({ mime_type: 'image/jpeg', data: { links: ['https://x'] } });
  if (!(n2.mimeType === 'image/jpeg' && n2.externalUrl === 'https://x' && n2.isExternal === true)) {
    console.error('normalizeAttachment failed for legacy links');
    process.exit(1);
  }
  const n3 = normalizeAttachment({ mimeType: 'application/json', data: { k: 'v' } });
  if (!(n3.mimeType === 'application/json' && typeof n3.data === 'string' && n3.data.includes('"k"'))) {
    console.error('normalizeAttachment should stringify non-string data');
    process.exit(1);
  }

  // validateAttachment basics
  const v1 = validateAttachment({ id: 'a', mimeType: 'image/jpeg', data: 'AAAA' });
  if (!v1.ok) { console.error('validateAttachment should accept basic embedded data'); process.exit(1); }
  const v2 = validateAttachment({ id: 'b', mimeType: 'image/jpeg', externalUrl: 'https://x' });
  if (!v2.ok) { console.error('validateAttachment should accept external url'); process.exit(1); }
  const v3 = validateAttachment({ id: '', mimeType: 'x' });
  if (v3.ok) { console.error('validateAttachment should reject empty id'); process.exit(1); }
  const v4 = validateAttachment({ id: 'c', mimeType: 'x' });
  if (v4.ok) { console.error('validateAttachment should require data or externalUrl'); process.exit(1); }

  // Array helpers
  const arr = normalizeAttachments([
    { mime_type: 'image/jpeg', data: { base64: 'AAAA' } },
    { mimeType: 'image/png', externalUrl: 'https://x' },
  ]);
  const arrV = validateAttachments(arr);
  if (!arrV.ok) { console.error('validateAttachments should pass for normalized valid list'); process.exit(1); }

  console.log('Attachment utilities tests passed.');
} catch (e) {
  console.error('Attachment utilities tests failed:', e?.message || e);
  process.exit(1);
}