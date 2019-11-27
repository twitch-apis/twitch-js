import includes from 'lodash/includes'
import toLower from 'lodash/toLower'

import createLogger, { Logger } from '../utils/logger/create'

import fetchUtil from '../utils/fetch'
import * as Errors from '../utils/fetch/Errors'
import * as validators from './utils/validators'

import * as types from './types'
export * from './types'

/**
 * @class
 * @public
 *
 * @example <caption>Get Featured Streams</caption>
 * const token = 'cfabdegwdoklmawdzdo98xt2fo512y'
 * const username = 'ronni'
 * const { api } = new TwitchJs({ token, username })
 *
 * api.get('streams/featured').then(response => {
 *   // Do stuff ...
 * })
 */
class Api {
  private _options: types.Options
  private _log: Logger

  private _readyState = 1

  private _status: ApiRootResponse

  constructor(maybeOptions: types.Options) {
    /**
     * @type {ApiOptions}
     * @private
     */
    this.options = maybeOptions

    this._log = createLogger({ scope: 'Api', ...this.options.log })
  }

  set options(maybeOptions) {
    this._options = validators.apiOptions(maybeOptions)
  }

  get options() {
    return this._options
  }

  get readyState() {
    return this._readyState
  }

  get status() {
    return this._status
  }

  /**
   * New client options. To update `token` or `clientId`, use [**api.initialize()**]{@link Api#initialize}.
   */
  updateOptions(options: types.Options) {
    const { clientId, token } = this.options
    this.options = { ...options, clientId, token }
  }

  /**
   * Initialize API client and retrieve status.
   * @see https://dev.twitch.tv/docs/v5/#root-url
   */
  async initialize(newOptions: Partial<types.Options>) {
    if (newOptions) {
      this.options = { ...this.options, ...newOptions }
    }

    if (!newOptions && this.readyState === 2) {
      return Promise.resolve()
    }

    const statusResponse = await this.get<ApiRootResponse>()

    this._readyState = 2
    this._status = statusResponse

    return statusResponse
  }

  /**
   * Check if current credentials include `scope`.
   * @see https://dev.twitch.tv/docs/authentication/#twitch-api-v5
   */
  hasScope(
    /** Scope to check */
    scope: string,
  ) {
    return new Promise((resolve, reject) => {
      if (this.readyState !== 2 || !this.status) {
        return reject(false)
      }

      return includes(this.status.token.authorization.scopes, scope)
        ? resolve(true)
        : reject(false)
    })
  }

  /**
   * GET endpoint.
   *
   * @example <caption>Get Live Overwatch Streams</caption>
   * api.get('streams', { search: { game: 'Overwatch' } })
   *   .then(response => {
   *     // Do stuff with response ...
   *   })
   * @example <caption>Get user follows (Helix)</caption>
   * api.get('users/follows', { version: 'helix', search: { to_id: '23161357' } })
   *   .then(response => {
   *     // Do stuff with response ...
   *   })
   */
  get<T = any>(endpoint = '', options?: types.FetchOptions) {
    return this._handleFetch<T>(endpoint, options)
  }

  /**
   * POST endpoint.
   */
  post<T = any>(endpoint: string, options?: types.FetchOptions) {
    return this._handleFetch<T>(endpoint, { ...options, method: 'post' })
  }

  /**
   * PUT endpoint.
   */
  put<T = any>(endpoint: string, options?: types.FetchOptions) {
    return this._handleFetch<T>(endpoint, { ...options, method: 'put' })
  }

  private _isVersionHelix(version: ApiVersions) {
    return toLower(version) === ApiVersions.Helix
  }

  private _getBaseUrl(version: ApiVersions) {
    return types.Settings[version].baseUrl
  }

  private _getHeaders(version: ApiVersions): types.Headers {
    const { clientId, token } = this.options

    const isHelix = this._isVersionHelix(version)

    const headers = isHelix
      ? { 'Client-ID': clientId }
      : { Accept: 'application/vnd.twitchtv.v5+json', 'Client-ID': clientId }

    if (token) {
      const authorizationHeader = types.Settings[version].authorizationHeader
      const authorization = `${authorizationHeader} ${token}`

      return { ...headers, Authorization: authorization }
    }

    return headers
  }

  private async _handleFetch<T = any>(
    maybeUrl: string = '',
    options: types.FetchOptions,
  ) {
    const { version = ApiVersions.Helix, ...fetchOptions } = options

    const baseUrl = this._getBaseUrl(version)

    const url = `${baseUrl}/${maybeUrl}`

    const message = `${fetchOptions.method || 'GET'} ${baseUrl}`

    const fetchProfiler = this._log.startTimer(message)

    const performRequest = () =>
      fetchUtil<T>(url, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          ...this._getHeaders(version),
        },
      })

    try {
      return await performRequest()
    } catch (error) {
      if (error instanceof Errors.AuthenticationError) {
        const token = await this.options.onAuthenticationFailure()

        await this.initialize({ token })

        this._log.info('Retrying (with new credentials)')

        return await performRequest()
      }
    } finally {
      fetchProfiler.done(message)
    }
  }
}

export default Api