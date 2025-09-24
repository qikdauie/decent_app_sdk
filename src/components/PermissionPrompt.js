/**
 * Minimal framework-agnostic permission prompt helper.
 * Consumers can replace this with their own UI; this is a reference.
 */

export function renderPermissionPrompt(container, requests = [], options = {}) {
  const root = typeof container === 'string' ? document.querySelector(container) : container;
  if (!root) throw new Error('PermissionPrompt: container not found');
  const title = options.title || 'Allow permissions?';
  const acceptText = options.acceptText || 'Allow';
  const declineText = options.declineText || 'Deny';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:99999;';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:#fff;color:#111;min-width:320px;max-width:520px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.3);overflow:hidden;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;';
  modal.innerHTML = `
    <div style="padding:16px 20px;border-bottom:1px solid #eee;font-weight:600;font-size:16px;">${title}</div>
    <div style="padding:12px 20px;max-height:50vh;overflow:auto;">
      ${(requests || []).map(r => `
        <div style="margin:10px 0;">
          <div style="font-weight:600;font-size:14px;">${escapeHtml(r.protocolName || r.protocolUri)}</div>
          ${(Array.isArray(r.messageTypes) ? r.messageTypes : []).map(mt => `<div style="opacity:.8;font-size:12px;">${escapeHtml(mt.typeUri || '')}${mt.description ? ' — ' + escapeHtml(mt.description) : ''}</div>`).join('')}
          ${r.description ? `<div style="margin-top:6px;font-size:12px;opacity:.8;">${escapeHtml(r.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;padding:12px 20px;border-top:1px solid #eee;">
      <button data-action="deny" style="background:#eee;border:0;padding:8px 14px;border-radius:6px;cursor:pointer;">${declineText}</button>
      <button data-action="allow" style="background:#111;color:#fff;border:0;padding:8px 14px;border-radius:6px;cursor:pointer;">${acceptText}</button>
    </div>
  `;
  wrapper.appendChild(modal);
  document.body.appendChild(wrapper);

  return new Promise(resolve => {
    const onClick = (e) => {
      const action = e.target?.getAttribute?.('data-action');
      if (!action) return;
      cleanup();
      resolve(action === 'allow');
    };
    wrapper.addEventListener('click', onClick);
    function cleanup() { try { wrapper.removeEventListener('click', onClick); } catch {} try { wrapper.remove(); } catch {} }
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


