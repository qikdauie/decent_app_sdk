import { describe, it, expect } from 'vitest';
import { ProtocolRegistry } from '../registry.js';
import { BaseProtocol } from '../base.js';

class TestProtocol extends BaseProtocol {
  constructor() {
    super({ id: 'test', piuri: 'urn:test:1.0', messageTypes: ['urn:test/1.0/msg'] });
  }
  supportsMessageType(t) { return t === 'urn:test/1.0/msg'; }
  async handleIncoming() { return true; }
  declareClientMethods() { return { hello: { params: ['name'] } }; }
  async invokeClientMethod(name, args) { if (name === 'hello') return { hi: String(args?.[0] || 'world') }; }
}

describe('ProtocolRegistry', () => {
  it('registers, routes, and invokes client methods', async () => {
    const reg = new ProtocolRegistry({ logger: console });
    reg.init({ pack: async () => ({}), unpack: async () => ({}), send: async () => ({}), sendType: async () => ({}) });
    const p = new TestProtocol();
    reg.register(p);
    expect(await reg.routeIncoming({ type: 'urn:test/1.0/msg' })).toBe(true);
    const methods = reg.getAllProtocolClientMethods();
    expect(methods.test).toBeTruthy();
    const r = await reg.invokeProtocolClientMethod('test', 'hello', ['Alice']);
    expect(r).toEqual({ hi: 'Alice' });
  });
});


