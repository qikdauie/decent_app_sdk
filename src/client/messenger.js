/**
 * Messenger client — polished RPC over MessageChannel to the Service Worker.
 */

export class MessengerClient {
  constructor(options = {}) {
    this.swUrl = options.serviceWorkerUrl || '/sw.js';
    this.readinessTimeoutMs = Number(options.readinessTimeoutMs || 8000);
    this.rpcTimeoutMs = Number(options.rpcTimeoutMs || 60000);
    this.controller = null;
    this.ready = this.#init();
  }

  async #init() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported in this environment.');
    }
    let registration;
    try {
      registration = await navigator.serviceWorker.register(this.swUrl, { type: 'module' });
    } catch (err) {
      throw new Error(`Failed to register Service Worker at "${this.swUrl}": ${(err && err.message) || err}`);
    }
    this.controller = await waitForControllerOrActive(registration, this.readinessTimeoutMs);
  }

  rpc(kind, data, timeoutMs = this.rpcTimeoutMs) {
    if (!kind) return Promise.reject(new Error('RPC kind is required.'));
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      let settled = false;
      const done = (fn, value) => { if (settled) return; settled = true; cleanup(); fn(value); };
      const onMessage = (event) => done(resolve, event.data);
      const onMessageError = () => done(reject, new Error(`RPC "${kind}" failed to deserialize message.`));
      const timeoutId = setTimeout(() => done(reject, new Error(`RPC "${kind}" timed out after ${timeoutMs}ms.`)), timeoutMs);
      const cleanup = () => { clearTimeout(timeoutId); channel.port1.onmessage = null; channel.port1.onmessageerror = null; try { channel.port1.close(); } catch {} try { channel.port2.close(); } catch {} };
      channel.port1.onmessage = onMessage;
      channel.port1.onmessageerror = onMessageError;
      try { this.controller.postMessage({ kind, data, port: channel.port2 }, [channel.port2]); } catch (err) {
        done(reject, new Error(`Failed to post RPC "${kind}": ${(err && err.message) || err}`));
      }
    });
  }
}

async function waitForControllerOrActive(registration, timeoutMs) {
  const active = registration && registration.active;
  if (active) return active;
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
  const controllerPromise = new Promise((resolve) => {
    const onChange = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.removeEventListener('controllerchange', onChange);
        resolve(navigator.serviceWorker.controller);
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
  });
  // Also wait for the registration to become active, even if the page
  // is not yet controlled (e.g., missing clients.claim()). Once active,
  // we can still message the SW via registration.active.postMessage().
  const activationPromise = new Promise((resolve) => {
    const tryResolveIfActive = () => {
      try {
        if (registration && registration.active) {
          cleanup();
          resolve(registration.active);
        }
      } catch {}
    };

    let installingRef = null;
    const onStateChange = () => {
      tryResolveIfActive();
    };
    const onUpdateFound = () => {
      try {
        installingRef = registration.installing || registration.waiting || installingRef;
        if (installingRef) installingRef.addEventListener('statechange', onStateChange);
        tryResolveIfActive();
      } catch {}
    };
    const cleanup = () => {
      try { registration.removeEventListener('updatefound', onUpdateFound); } catch {}
      try { installingRef && installingRef.removeEventListener('statechange', onStateChange); } catch {}
    };

    // Hook current state and listeners
    try {
      registration.addEventListener('updatefound', onUpdateFound);
      installingRef = registration.installing || registration.waiting || null;
      if (installingRef) installingRef.addEventListener('statechange', onStateChange);
    } catch {}

    // Initial check in case activation raced ahead
    tryResolveIfActive();
  });
  const timeoutPromise = new Promise((_, reject) => {
    const id = setTimeout(() => { clearTimeout(id); reject(new Error(`Service Worker did not gain control within ${timeoutMs}ms.`)); }, timeoutMs);
  });
  return Promise.race([controllerPromise, activationPromise, timeoutPromise]);
}


