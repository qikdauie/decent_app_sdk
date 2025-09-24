/**
 * Minimal protocol handler UI helper: listens to window messages from SW
 * and provides a hook to render per-message UI.
 */

export function attachProtocolHandler(renderFn) {
  if (typeof renderFn !== 'function') throw new Error('renderFn must be a function');
  const handler = (e) => {
    const data = e?.data;
    // Pass through any message; apps can filter by kind/type inside renderFn
    try { renderFn(data); } catch {}
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}


