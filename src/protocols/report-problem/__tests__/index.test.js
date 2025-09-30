// @ts-nocheck
import { describe, it, expect } from 'vitest';
/// <reference types="vitest" />
import ReportProblemProtocol from '../index.js';

function makeRuntime() {
  return {
    pack: async () => ({}),
    unpack: async (raw) => ({ success: true, message: JSON.stringify(raw) }),
    send: async () => 'success',
    sendType: async () => true,
    registry: {},
    permissions: {},
  };
}

describe.skip('report-problem protocol', () => {
  // Sending and storage behavior relies on runtime and is covered by
  // UI-triggered tests at `src/tests/ui-triggered/sdk/protocols/report-problem.test.js`.
});


