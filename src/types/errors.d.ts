export interface AppSdkErrorLike { name: string; domain: string; code: string; message: string; details?: any }
export class AppSdkError extends Error { domain: string; code: string; details?: any; toJSON(): AppSdkErrorLike }
export const ErrorCodes: { [domain: string]: { [code: string]: string } };
export function createValidationError(message?: string, details?: any): AppSdkError;
export function createPermissionError(message?: string, details?: any): AppSdkError;
export function createRoutingError(message?: string, details?: any): AppSdkError;
export function createRpcError(message?: string, details?: any): AppSdkError;


