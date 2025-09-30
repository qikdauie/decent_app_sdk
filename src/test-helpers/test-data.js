export const makeDid = (id = 'example') => `did:${id}:${Math.random().toString(36).slice(2, 10)}`;
export const makeMessage = ({ thid = 't-1', type = 'test', body = {} } = {}) => ({ thid, type, body });
export const makeV1ThreadedMessage = ({ thid = 't-1', type = 'test', body = {} } = {}) => ({ '~thread': { thid }, type, body });
export const makeAttachment = ({ id = undefined, mimeType = 'application/json', data = '"x"', externalUrl = undefined } = {}) => ({ id, mimeType, data, externalUrl });
export const makeJWE = ({ ciphertext = '00', protectedHeader = 'e30', recipients = [] } = {}) => ({ ciphertext, protected: protectedHeader, recipients });
export const makeJWS = ({ payload = 'e30', signature = '00', header = {} } = {}) => ({ payload, signature, header });
export const makeProtocolDef = ({ piuri = 'urn:example:test/1.0', handlers = {} } = {}) => ({ piuri, handlers });
export const makeError = ({ code = 1, message = 'error' } = {}) => ({ code, message });

export const invalid = {
  nullish: [null, undefined],
  emptyObj: {},
  emptyArr: [],
  malformedMessage: '{ not: json',
  oversizedData: 'A'.repeat(1024 * 1024 + 1),
};
