// SDK test setup: crypto polyfill and global snapshot helpers
import { Crypto } from '@peculiar/webcrypto';

if (!globalThis.crypto || typeof globalThis.crypto.subtle === 'undefined') {
  globalThis.crypto = new Crypto();
}

if (!globalThis.__snapGlobals) {
  globalThis.__snapGlobals = function () {
    return {
      self: globalThis.self,
      navigator: globalThis.navigator,
    };
  };
}

if (!globalThis.__restoreGlobals) {
  globalThis.__restoreGlobals = function (snap) {
    if (snap && typeof snap === 'object') {
      globalThis.self = snap.self;
      globalThis.navigator = snap.navigator;
    }
  };
}


