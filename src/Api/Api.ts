/// <reference types="ky" />

import ky from 'ky-universal'

import camelCaseKeys from 'camelcase-keys'

import createLogger, { Logger } from '../utils/logger'
import * as validators from './utils/validators'

import { ApiOptions } from './types'
import { Settings } from './constants'

/**
 * @see https://github.com/sindresorhus/ky/tree/v0.26.0#readme
 */
type Ky = typeof ky

/**
 * Make requests to Twitch Helix API.
 *
 * The API client is a simple wrapper around [[`Ky`]] that handles request
 * headers, retries, and token refreshes. For additional options, see
 * [Ky documentation](https://github.com/sindresorhus/ky/tree/v0.26.0#readme).
 *
 * ## Initializing
 *
 * ```js
 * // With a token ...
 * const token = 'cfabdegwdoklmawdzdo98xt2fo512y'
 * const { api } = new TwitchJs({ token })
 *
 * // ... or with a client ID ...
 * const clientId = 'uo6dggojyb8d6soh92zknwmi5ej1q2'
 * const { api } = new TwitchJs({ clientId })
 * ```
 *
 * **Note:** The recommended way to initialize the API client is with a token.
 *
 * ## Making requests
 *
 * The API client makes requests to the
 * [Helix API](https://dev.twitch.tv/docs/api). To make requests to the
 * [Kraken/v5 API](https://dev.twitch.tv/docs/v5), use [[`Api.kraken`]].
 *
 * @example Get streams
 * ```js
 * api('streams', { searchParams: { first: 20 } })
 *   .json()
 *   .then(response => {
 *     // Do stuff with response ...
 *   })
 * ```
 *
 * @example Start commercial
 * ```js
 * api('channels/commercial', {
 *   method: 'post',
 *   json: { broadcaster_id: '41245072', length: 60 },
 * })
 *   .json()
 *   .then(response => {
 *     // Do stuff with response ...
 *   })
 * ```
 *
 * @example Create clip
 * ```js
 * api
 *   .post('clips', { searchParams: { broadcaster_id: '44322889' } })
 *   .json()
 *   .then(response => {
 *     // Do stuff with response ...
 *   })
 * ```
 */
interface Api extends Ky {}
class Api {
  private options: ApiOptions
  private log: Logger
  private api: Ky

  /**
   * Make API request to Kraken API.
   *
   * @example Get the latest Overwatch live streams
   * ```
   * api
   *   .kraken
   *   .get('streams', { searchParams: { game: 'Overwatch' } })
   *   .json()
   *   .then(response => {
   *     // Do stuff with response ...
   *   })
   * ```
   *
   * @example Start a channel commercial
   * ```
   * const channelId = '44322889'
   * api
   *   .kraken
   *   .post(`channels/${channelId}/commercial`, { json: { length: 30 } })
   *   .json()
   *   .then(response => {
   *     // Do stuff with response ...
   *   })
   * ```
   */
  public kraken: Ky

  constructor(options: Partial<ApiOptions>) {
    this.options = validators.apiOptions(options)

    this.log = createLogger({ name: 'Api', ...this.options.log })

    // Create Helix API client.
    this.api = ky.create({
      prefixUrl: Settings.Helix.BaseUrl,
      hooks: {
        beforeRequest: [
          // Log requests.
          (request) => {
            this.log.debug(request, `Requesting ${request.url} ...`)
          },
          // Add headers.
          (request) => {
            const isKrakenRequest = request.url.startsWith(
              Settings.Kraken.BaseUrl,
            )

            // Add Kraken headers.
            if (isKrakenRequest) {
              request.headers.set('Accept', 'application/vnd.twitchtv.v5+json')
            }

            // Add client ID header.
            if (this.options.clientId) {
              request.headers.set('Client-ID', this.options.clientId)
            }

            // Add token header.
            if (this.options.token) {
              const bearer = isKrakenRequest
                ? Settings.Kraken.Bearer
                : Settings.Helix.Bearer

              request.headers.set(
                'Authorization',
                `${bearer} ${this.options.token}`,
              )
            }
          },
        ],
        beforeRetry: [
          // Log retries.
          ({ request, error, retryCount }) => {
            this.log.debug(error, `Retrying ${request.url} (${retryCount})`)
          },
        ],
        afterResponse: [
          // Log responses.
          (request, _options, response) => {
            if (!response.ok) {
              this.log.error(response, `Request ${request.url} failed`)
            } else {
              this.log.debug(response, `Request ${request.url} completed`)
            }
          },
          // Token refreshing.
          async (request, _options, response) => {
            if (
              this.options.onAuthenticationFailure &&
              response.status === 403
            ) {
              // Get a fresh token.
              const token = await this.options.onAuthenticationFailure()
              this.updateOptions({ token })
              this.log.debug(`Token refreshed, retrying ${request.url} ...`)

              const bearer = request.url.startsWith(Settings.Kraken.BaseUrl)
                ? Settings.Kraken.Bearer
                : Settings.Helix.Bearer

              // Retry with the token.
              request.headers.set('Authorization', `${bearer} ${token}`)

              return ky(request)
            }
          },
        ],
      },
      parseJson: (text) => camelCaseKeys(JSON.parse(text), { deep: true }),
    })

    // Create Kraken API client.
    this.kraken = ky.extend({ prefixUrl: Settings.Kraken.BaseUrl })

    return Object.assign(this.api, this)
  }

  /**
   * Update API client options.
   */
  updateOptions(options: Partial<ApiOptions>) {
    this.options = validators.apiOptions(options)
  }
}

export default Api
