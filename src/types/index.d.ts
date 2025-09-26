export interface DecentClientOptions {
  serviceWorkerUrl?: string;
  readinessTimeoutMs?: number;
  rpcTimeoutMs?: number;
}

export interface ProtocolCapability {
  ['feature-type']: 'protocol' | 'message-type' | 'goal-code';
  id: string;
  roles?: string[];
}

export class DecentClient {
  constructor(config?: DecentClientOptions);
  ready: Promise<void>;
  messenger: any;
  protocols: ProtocolHelpers;
  permissions: PermissionHelpers;
  getDID(): Promise<PeerDIDResult>;
  registerAddress(did: string): Promise<RouterResult>;
  pack(dest: string, type: string, bodyJson: string, attachments?: DIDCommAttachment[], replyTo?: string): Promise<MessageOpResult>;
  unpack(raw: any): Promise<MessageOpResult>;
  send(dest: string, packed: any, threadId?: string): Promise<RouterResult>;
  sendOk(dest: string, packed: any, threadId?: string): Promise<boolean>;
  registerAddressOk(did: string): Promise<boolean>;
  getDIDOk(): Promise<boolean>;
  packOk(dest: string, type: string, bodyJson: string, attachments?: DIDCommAttachment[], replyTo?: string): Promise<boolean>;
  unpackOk(raw: any): Promise<boolean>;
  isLastOperationSuccess(result: any): boolean;
  getLastError(result: any): string | null;
  onMessage(cb: (raw: any) => void): () => void;
}

export declare function getDecentClient(options?: DecentClientOptions): DecentClient;
export declare function getReadyDecentClient(options?: DecentClientOptions): Promise<DecentClient>;

// RouterResult enum from IDL
export type RouterResult = 
  | 'success'
  | 'aborted'
  | 'access-denied'
  | 'invalid-address'
  | 'address-in-use'
  | 'invalid-message'
  | 'no-route'
  | 'validation-failed'
  | 'authentication-failed'
  | 'request-expired'
  | 'rate-limit-exceeded'
  | 'unknown-error';

// PeerDIDResult dictionary from IDL
export interface PeerDIDResult {
  success: boolean;
  error_code: number;
  error: string;
  did: string;
  did_document: string;
  public_key: string;
}

// MessageOpResult dictionary from IDL
export interface MessageOpResult {
  success: boolean;
  error_code: number;
  error: string;
  message: string;
}


/**
 * Canonical DIDComm attachment format used across the SDK.
 * - Required: `id`, `mimeType`
 * - Optional: `filename`, `description`, `data`, `externalUrl`, `isExternal`
 * - Exactly one of `data` or `externalUrl` should be set for most use-cases.
 * - `data` must be a string (e.g. base64 or JSON stringified payloads).
 * - `isExternal` defaults to false; when `externalUrl` is present it is set to true by helpers.
 * - Legacy compatibility: the SDK `normalizeAttachment()` accepts legacy shapes (mime_type, data.base64, data.links, url, links) and converts them.
 *
 * Examples:
 * - Embedded base64 image:
 *   { id: 'photo-1', mimeType: 'image/jpeg', filename: 'photo.jpg', data: 'base64...' }
 * - External URL document:
 *   { id: 'doc-1', mimeType: 'application/pdf', filename: 'file.pdf', externalUrl: 'https://example.org/file.pdf', isExternal: true }
 * - JSON payload:
 *   { id: 'meta-1', mimeType: 'application/json', data: '{"k":"v"}' }
 */
export interface DIDCommAttachment {
  id: string;
  mimeType: string;
  filename?: string;
  description?: string;
  data?: string;
  externalUrl?: string;
  isExternal?: boolean;
}

// Permission-related interfaces from IDL
export interface DIDCommMessageTypeRequest {
  typeUri: string;
  description?: string;
}

export interface DIDCommProtocolRequest {
  protocolUri: string;
  protocolName?: string;
  description?: string;
  messageTypes?: DIDCommMessageTypeRequest[];
  requireAllMessageTypes?: boolean;
}

export interface DIDCommProtocolPermission {
  protocolUri: string;
  grantedMessageTypes: string[];
  deniedMessageTypes: string[];
  isFullyGranted: boolean;
  expiresAt: number;
}

export interface ProtocolPermissionResult {
  success: boolean;
  errorMessage?: string;
  grantedPermissions: DIDCommProtocolPermission[];
  failedProtocols: string[];
}

// Response helper function types
export declare function isDIDSuccess(result: any): result is PeerDIDResult & { success: true };
export declare function isMessageOpSuccess(result: any): result is MessageOpResult & { success: true };
export declare function isRouterSuccess(result: any): result is 'success';
export declare function isPermissionSuccess(result: any): result is ProtocolPermissionResult & { success: true };
export declare function isSuccess(result: any): boolean;
export declare function getErrorMessage(result: any): string | null;
export declare function getErrorCode(result: any): number | null;

// Factory helpers exported from client index
export declare function createProtocolHelpers(messenger: any): ProtocolHelpers;
export declare function createPermissionHelpers(messenger: any): PermissionHelpers;

export interface PermissionHelpers {
  check(protocolUri: string, messageTypeUri: string): Promise<boolean>;
  checkMultiple(protocolUris: string[], messageTypeUris: string[]): Promise<boolean[]>;
  request(requests: DIDCommProtocolRequest[]): Promise<ProtocolPermissionResult>;
  listGranted(protocolUris: string[]): Promise<DIDCommProtocolPermission[]>;
  requestOk(requests: DIDCommProtocolRequest[]): Promise<boolean>;
  getRequestError(requests: DIDCommProtocolRequest[]): Promise<string | null>;
  isSuccess(result: any): boolean;
  getError(result: any): string | null;
}

export interface ProtocolHelpers {
  discover(matchers: string | string[], timeout?: number): Promise<{ ok: boolean; result?: any; error?: string }>;
  advertise(featureType: string, id: string, roles?: string[]): Promise<boolean>;
  discoverOk(matchers: string | string[], timeout?: number): Promise<boolean>;
  getDiscoverError(matchers: string | string[], timeout?: number): Promise<string | null>;
  intents: {
    advertise(actionOrRequestType: string, roles?: string[]): Promise<boolean>;
    discover(matchers?: string | string[], timeout?: number): Promise<{ ok: boolean; result?: any; error?: string }>;
    request(dest: string, requestBody: any, opts?: any): Promise<{ ok: boolean; result?: any; error?: string }>;
    requestOk(dest: string, requestBody: any, opts?: any): Promise<boolean>;
    getRequestError(dest: string, requestBody: any, opts?: any): Promise<string | null>;
  };
  isSuccess(result: any): boolean;
  getError(result: any): string | null;
}

