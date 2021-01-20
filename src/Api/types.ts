import { LoggerOptions } from '../utils/logger'

export type ApiOptions = {
  token: string
  clientId?: string
  log?: LoggerOptions
  onAuthenticationFailure?: () => Promise<string>
}

export enum ApiReadyStates {
  'NOT_READY',
  'READY',
  'INITIALIZED',
}

export type ApiSettings = {
  BaseUrl: string
  Bearer: string
}
