import { ApiVersions } from '../twitch'

import { FetchOptions } from '../utils/fetch'
import { LoggerOptions } from '../utils/logger'

export type ApiOptions = {
  token: string
  clientId?: string
  log?: LoggerOptions

  /**
   * Called when a 401: Unauthorized response is returned.
   * Returns a `Promise` that must resolve with the refreshed token.
   * Upon resolution, the original request (with original parameters) is repeated using the provided token.
   * @see https://github.com/twitch-js/twitch-js#refreshing-tokens
   */
  onAuthenticationFailure?: () => Promise<string>
}

export enum ApiReadyStates {
  'NOT_READY',
  'READY',
  'INITIALIZED',
}

export type ApiSettings = {
  baseUrl: string
  authorizationHeader: string
}

export const Settings: Record<ApiVersions, ApiSettings> = {
  [ApiVersions.Helix]: {
    baseUrl: 'https://api.twitch.tv/helix',
    authorizationHeader: 'Bearer',
  },
  [ApiVersions.Kraken]: {
    baseUrl: 'https://api.twitch.tv/kraken',
    authorizationHeader: 'OAuth',
  },
}

export type ApiHeaders = Record<string, string> & {
  'Client-ID'?: string
  Accept?: string
  Authorization?: string
}

type ApiVersionOptions = {
  version?: ApiVersions
}

export type ApiFetchOptions = FetchOptions & ApiVersionOptions
