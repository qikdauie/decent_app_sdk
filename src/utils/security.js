/** Security utility helpers (derived from patterns in tests) */

export function isNonEmptyString(v) { return typeof v === 'string' && v.length > 0; }
export function isDid(v) { return isNonEmptyString(v) && v.startsWith('did:'); }

export function validateMessageShape(msg) {
  if (!msg || typeof msg !== 'object') return false;
  if (!isNonEmptyString(msg.type)) return false;
  if (msg.from && !isDid(msg.from)) return false;
  return true;
}

export function constantTimeEqual(a, b) {
  // Naive constant-time compare for short secrets
  const aa = String(a || '');
  const bb = String(b || '');
  if (aa.length !== bb.length) return false;
  let out = 0;
  for (let i = 0; i < aa.length; i++) out |= (aa.charCodeAt(i) ^ bb.charCodeAt(i));
  return out === 0;
}


