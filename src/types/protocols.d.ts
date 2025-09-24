export interface ProtocolRuntime {
  pack(dest: string, type: string, bodyJson: string, attachments?: any[], replyTo?: string): Promise<any>;
  unpack(raw: any): Promise<any>;
  send(dest: string, packed: string): Promise<any>;
  sendType(dest: string, type: string, body: any): Promise<any>;
  registry: any;
  permissions: any;
  logger?: Console;
}

export interface ProtocolMeta {
  id: string;
  piuri: string;
  version?: string;
  messageTypes?: string[];
  requiredPermissions?: { protocolUri: string; messageTypeUris?: string[] }[];
}

export class BaseProtocol {
  constructor(meta: ProtocolMeta);
  meta: Required<ProtocolMeta> & { messageTypes: string[]; requiredPermissions: any[] };
  runtime: ProtocolRuntime | null;
  register(runtime: ProtocolRuntime): void;
  supportsMessageType(typeUri: string): boolean;
  handleIncoming(envelope: { type: string; from?: string; body?: any; raw?: any }): Promise<boolean>;
  advertiseCapabilities(): { ['feature-type']: string; id: string; roles?: string[] }[];
  cleanup(): Promise<void>;
}

export class ProtocolRegistry {
  constructor(options?: { logger?: Console });
  init(runtime: Omit<ProtocolRuntime, 'registry'> & { permissions?: any; logger?: Console }): void;
  register(protocol: BaseProtocol): void;
  unregister(protocolId: string): Promise<boolean>;
  routeIncoming(envelope: { type: string; from?: string; body?: any; raw?: any }): Promise<boolean>;
  advertiseFeature(featureType: 'protocol' | 'goal-code' | 'message-type', id: string, roles?: string[]): void;
  aggregateCapabilities(): { ['feature-type']: string; id: string; roles?: string[] }[];
}

// Built-in protocols and helpers (namespaced to mirror runtime exports)
export namespace DiscoverFeatures {
  export class DiscoverFeaturesProtocol extends BaseProtocol {}
  export function discoverFeatures(
    runtime: ProtocolRuntime,
    matchers?: string | string[],
    timeout?: number
  ): Promise<Record<string, any[]>>;
}

export namespace AppIntents {
  export interface AppIntentsOptions {
    router?: AppIntents.IntentRouter;
    roles?: string[];
    advertise?: boolean;
  }

  export class AppIntentsProtocol extends BaseProtocol {
    constructor(options?: AppIntentsOptions);
  }

  export class IntentRouter {
    constructor(options?: { onRequest?: (envelope: any) => Promise<{
      accept?: boolean;
      response?: { result?: any };
      result?: any;
      decline?: { reason?: string; detail?: any; retry_after_ms?: number };
    }>; onCancel?: (envelope: any) => void; logger?: Console });
    onRequest?: (envelope: any) => Promise<any>;
    onCancel?: (envelope: any) => void;
    handleIncoming(envelope: any, runtime: ProtocolRuntime): Promise<boolean>;
  }

  export const INTENTS: Record<string, string>;
}


