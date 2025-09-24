
export interface InitServiceWorkerOptions {
  autoUnpack?: boolean;
  deliveryStrategy?: 'broadcast' | 'thread';
  appIntents?: { router?: { onRequest?: (envelope: any) => Promise<any>; onCancel?: (envelope: any) => void }; roles?: string[]; advertise?: boolean };
  builtInProtocols?: boolean;
  logger?: Console;
}

export declare function initServiceWorker(config?: InitServiceWorkerOptions): { registry: any; runtime: any };
