import Chat, { constants as ChatConstants } from './Chat'
import Api from './Api'

/**
 * TwitchJs client
 * @example <caption>Instantiating TwitchJS</caption>
 * const token = 'cfabdegwdoklmawdzdo98xt2fo512y'
 * const username = 'ronni'
 * const twitchJs = new TwitchJs({ token, username })
 *
 * twitchJs.chat.connect().then(globalUserState => {
 *   // Do stuff ...
 * })
 *
 * twitchJs.api.get('channel').then(response => {
 *   // Do stuff ...
 * })
 */
class TwitchJs {
  /**
   * TwitchJs constructor
   * @param {Object} options
   * @param {string} options.token
   * @param {string} options.username
   * @param {string} options.clientId
   * @param {Object} options.log
   * @param {function} [options.onAuthenticationFailure]
   * @param {ChatOptions} [options.chat]
   * @param {ApiOptions} [options.api]
   */
  constructor({
    token,
    username,
    clientId,
    log,
    onAuthenticationFailure,
    chat,
    api,
  }) {
    /** @type {Chat} */
    this.chat = new Chat({
      log,
      ...chat,
      token,
      username,
      onAuthenticationFailure,
    })
    /** @type {Object} */
    this.chatConstants = ChatConstants

    /** @type {Api} */
    this.api = new Api({
      log,
      ...api,
      token,
      clientId,
      onAuthenticationFailure,
    })
  }

  /**
   * Update client options.
   * @param {Object} options
   * @param {ChatOptions} [options.chat] New chat client options.
   * @param {ApiOptions} [options.api] New API client options.
   */
  updateOptions({ chat, api }) {
    this.chat.updateOptions(chat)
    this.api.updateOptions(api)
  }
}

export { Chat, ChatConstants }
export default TwitchJs
