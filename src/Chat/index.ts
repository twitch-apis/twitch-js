/**
 * EventEmitter3 is a high performance EventEmitter
 * @external EventEmitter3
 * @see {@link https://github.com/primus/eventemitter3 EventEmitter3}
 */

import EventEmitter from 'eventemitter3'

import get from 'lodash/get'

import createLogger, { Logger } from '../utils/logger/create'

import * as utils from '../utils'
import * as chatUtils from './utils'

import Client from './Client'
import * as Errors from './Errors'

import * as constants from './constants'
import * as commands from './utils/commands'
import * as parsers from './utils/parsers'
import * as sanitizers from './utils/sanitizers'
import * as validators from './utils/validators'

import * as types from './types'
export * from './types'

/**
 * @class
 * @public
 * @extends EventEmitter
 * @classdesc Twitch Chat Client
 *
 * @emits Chat#*
 * @emits Chat#CLEARCHAT
 * @emits Chat#CLEARCHAT/USER_BANNED
 * @emits Chat#GLOBALUSERSTATE
 * @emits Chat#HOSTTARGET
 * @emits Chat#JOIN
 * @emits Chat#MODE
 * @emits Chat#NAMES
 * @emits Chat#NAMES_END
 * @emits Chat#NOTICE
 * @emits Chat#NOTICE/ROOM_MODS
 * @emits Chat#PART
 * @emits Chat#PRIVMSG
 * @emits Chat#PRIVMSG/CHEER
 * @emits Chat#ROOMSTATE
 * @emits Chat#USERNOTICE
 * @emits Chat#USERNOTICE/ANON_GIFT_PAID_UPGRADE
 * @emits Chat#USERNOTICE/GIFT_PAID_UPGRADE
 * @emits Chat#USERNOTICE/RAID
 * @emits Chat#USERNOTICE/RESUBSCRIPTION
 * @emits Chat#USERNOTICE/RITUAL
 * @emits Chat#USERNOTICE/SUBSCRIPTION
 * @emits Chat#USERNOTICE/SUBSCRIPTION_GIFT
 * @emits Chat#USERSTATE
 *
 * @example <caption>Connecting to Twitch and joining #dallas</caption>
 * const token = 'cfabdegwdoklmawdzdo98xt2fo512y'
 * const username = 'ronni'
 * const channel = '#dallas'
 * const { chat } = new TwitchJs({ token, username })
 *
 * chat.connect().then(globalUserState => {
 *   // Listen to all messages
 *   chat.on('*', message => {
 *     // Do stuff with message ...
 *   })
 *
 *   // Listen to PRIVMSG
 *   chat.on('PRIVMSG', privateMessage => {
 *     // Do stuff with privateMessage ...
 *   })
 *
 *   // Do other stuff ...
 *
 *   chat.join(channel).then(channelState => {
 *     // Do stuff with channelState...
 *   })
 * })
 */
class Chat extends EventEmitter {
  private _options: types.Options

  private _log: Logger

  private _client: Client

  private _readyState = 0

  private _connectionAttempts = 0
  private _connectionInProgress: Promise<GlobalUserStateMessage>

  private _userState: UserStateMessage
  private _channelState: types.ChannelStates = {}

  /**
   * Chat constructor.
   * @param {ChatOptions} options
   */
  constructor(maybeOptions: types.Options) {
    super()

    this.options = maybeOptions

    /**
     * @type {any}
     * @private
     */
    this._log = createLogger({ scope: 'Chat', ...this.options.log })

    // Create commands.
    Object.assign(this, commands.factory(this))
  }

  /**
   * Retrieves the current
   */
  get options() {
    return this._options
  }

  /**
   * Validates the passed options before changing `_options`
   */
  set options(maybeOptions) {
    this._options = validators.chatOptions(maybeOptions)
  }

  /**
   * Connect to Twitch.
   */
  connect = () => {
    if (this._connectionInProgress) {
      return this._connectionInProgress
    }

    this._connectionInProgress = Promise.race([
      utils.rejectAfter(
        this.options.connectionTimeout,
        new Errors.TimeoutError(constants.ERROR_CONNECT_TIMED_OUT),
      ),
      this._handleConnectionAttempt(),
    ])
      .then(this._handleConnectSuccess.bind(this))
      .catch(this._handleConnectRetry.bind(this))

    return this._connectionInProgress
  }

  /**
   * Updates the clients options after first instantiation.
   * To update `token` or `username`, use `reconnect()`.
   */
  updateOptions(options: Partial<types.Options>) {
    const { token, username } = this.options
    this.options = { ...options, token, username }
  }

  /**
   * Sends a raw message to Twitch.
   */
  send: Client['send'] = (message, options) =>
    this._client.send(message, options)

  /**
   * Disconnected from Twitch.
   */
  disconnect = () => this._client.disconnect()

  /**
   * Reconnect to Twitch, providing new options to client.
   */
  reconnect = (newOptions?: types.Options) => {
    if (newOptions) {
      this.options = { ...this.options, ...newOptions }
    }

    this._connectionInProgress = null
    this._readyState = 2

    const channels = this._getChannels()
    this.disconnect()

    return this.connect().then(() =>
      Promise.all(channels.map(channel => this.join(channel))),
    )
  }

  /**
   * Join a channel.
   *
   * @example <caption>Joining #dallas</caption>
   * const channel = '#dallas'
   *
   * chat.join(channel).then(channelState => {
   *   // Do stuff with channelState...
   * })
   *
   * @example <caption>Joining multiple channels</caption>
   * const channels = ['#dallas', '#ronni']
   *
   * Promise.all(channels.map(channel => chat.join(channel)))
   *   .then(channelStates => {
   *     // Listen to all PRIVMSG
   *     chat.on('PRIVMSG', privateMessage => {
   *       // Do stuff with privateMessage ...
   *     })
   *
   *     // Listen to PRIVMSG from #dallas ONLY
   *     chat.on('PRIVMSG/#dallas', privateMessage => {
   *       // Do stuff with privateMessage ...
   *     })
   *     // Listen to all PRIVMSG from #ronni ONLY
   *     chat.on('PRIVMSG/#ronni', privateMessage => {
   *       // Do stuff with privateMessage ...
   *     })
   *   })
   */
  join = (maybeChannel: string) => {
    const channel = sanitizers.channel(maybeChannel)

    const joinProfiler = this._log.startTimer(`Joining ${channel}`)

    const connect = this.connect()
    const roomStateEvent = utils.resolveOnEvent<RoomStateMessage>(
      this,
      `${constants.COMMANDS.ROOM_STATE}/${channel}`,
    )
    const userStateEvent = !chatUtils.isUserAnonymous(this.options.username)
      ? utils.resolveOnEvent<UserStateMessage>(
          this,
          `${constants.COMMANDS.USER_STATE}/${channel}`,
        )
      : (Promise.resolve() as Promise<UserStateMessage | void>)

    const join = Promise.all([connect, roomStateEvent, userStateEvent]).then(
      ([, roomState, userState]) => {
        const channelState = {
          roomState: roomState.tags,
          userState: userState ? userState.tags : null,
        }

        this._setChannelState(roomState.channel, channelState)

        joinProfiler.done(`Joined ${channel}`)
        return channelState
      },
    )

    const send = this.send(`${constants.COMMANDS.JOIN} ${channel}`)

    return send.then(() =>
      Promise.race([
        utils.rejectAfter(
          this.options.joinTimeout,
          new Errors.TimeoutError(constants.ERROR_JOIN_TIMED_OUT),
        ),
        join,
      ]),
    )
  }

  /**
   * Depart from a channel.
   */
  part = (maybeChannel: string) => {
    const channel = sanitizers.channel(maybeChannel)
    this._log.info(`Parting ${channel}`)

    this._removeChannelState(channel)
    this.send(`${constants.COMMANDS.PART} ${channel}`)
  }

  /**
   * Send a message to a channel.
   */
  say = (maybeChannel: string, message: string, ...messageArgs: string[]) => {
    const channel = sanitizers.channel(maybeChannel)
    const args = messageArgs.length ? ['', ...messageArgs].join(' ') : ''

    const info = `PRIVMSG/${channel} :${message}${args}`

    const isModerator = get(this, ['_channelState', channel, 'isModerator'])

    const timeout = utils.rejectAfter(
      this.options.joinTimeout,
      new Errors.TimeoutError(constants.ERROR_SAY_TIMED_OUT),
    )

    const commandResolvers = commands.resolvers(this)(channel, message)

    const resolvers = () => Promise.race([timeout, ...commandResolvers])

    return utils
      .resolveInSequence([
        this._isUserAuthenticated.bind(this),
        this.send.bind(
          this,
          `${constants.COMMANDS.PRIVATE_MESSAGE} ${channel} :${message}${args}`,
          { isModerator },
        ),
        resolvers,
      ])
      .then(resolvedEvent => {
        this._log.info(info)
        return resolvedEvent
      })
      .catch(err => {
        this._log.error(info, err)
        throw err
      })
  }

  /**
   * Whisper to another user.
   */
  whisper = (user: string, message: string) =>
    utils.resolveInSequence([
      this._isUserAuthenticated.bind(this),
      this.send.bind(
        this,
        `${constants.COMMANDS.WHISPER} :/w ${user} ${message}`,
      ),
    ])

  /**
   * Broadcast message to all connected channels.
   */
  broadcast = (message: string) =>
    utils.resolveInSequence([
      this._isUserAuthenticated.bind(this),
      () =>
        Promise.all(
          this._getChannels().map(channel => this.say(channel, message)),
        ),
    ])

  _handleConnectionAttempt(): Promise<GlobalUserStateMessage> {
    return new Promise((resolve, reject) => {
      const connectProfiler = this._log.startTimer('Connecting ...')

      // Connect ...
      this._readyState = 1

      // Increment connection attempts.
      this._connectionAttempts += 1

      if (this._client) {
        // Remove all listeners, just in case.
        this._client.removeAllListeners()
      }

      // Create client and connect.
      this._client = new Client(this.options)

      // Handle messages.
      this._client.on(constants.EVENTS.ALL, this._handleMessage, this)

      // Handle disconnects.
      this._client.on(
        constants.EVENTS.DISCONNECTED,
        this._handleDisconnect,
        this,
      )

      // Listen for reconnects.
      this._client.once(constants.EVENTS.RECONNECT, () => this.reconnect())

      // Listen for authentication failures.
      this._client.once(constants.EVENTS.AUTHENTICATION_FAILED, reject)

      // Once the client is connected, resolve ...
      this._client.once(constants.EVENTS.CONNECTED, e => {
        connectProfiler.done('Connected')
        resolve(e)
      })
    })
  }

  _handleConnectSuccess(globalUserState: GlobalUserStateMessage) {
    this._readyState = 3
    this._connectionAttempts = 0

    // Process GLOBALUSERSTATE message.
    this._handleMessage(globalUserState)

    return globalUserState
  }

  _handleConnectRetry(error) {
    this._connectionInProgress = null
    this._readyState = 2

    this._log.info('Retrying ...')

    if (error.event === constants.EVENTS.AUTHENTICATION_FAILED) {
      return this.options
        .onAuthenticationFailure()
        .then(token => (this.options = { ...this.options, token }))
        .then(() => utils.resolveAfter(this.options.connectionTimeout))
        .then(() => this.connect())
        .catch(() => {
          this._log.error('Connection failed')
          throw new Errors.AuthenticationError(error)
        })
    }

    return this.connect()
  }

  _isUserAuthenticated() {
    return new Promise((resolve, reject) => {
      if (chatUtils.isUserAnonymous(this.options.username)) {
        reject(new Error('Not authenticated'))
      } else {
        resolve()
      }
    })
  }

  _emit(eventName, message) {
    if (eventName) {
      const displayName =
        get(message, 'tags.displayName') || message.username || ''
      const info = get(message, 'message') || ''
      this._log.info(`${eventName}`, `${displayName}${info ? ':' : ''}`, info)

      eventName
        .split('/')
        .filter(part => part !== '#')
        .reduce((parents, part) => {
          const eventParts = [...parents, part]
          super.emit(eventParts.join('/'), message)
          return eventParts
        }, [])
    }

    /**
     * All events are also emitted with this event name.
     * @event Chat#*
     */
    super.emit(constants.EVENTS.ALL, message)
  }

  _getChannels() {
    return Object.keys(this._channelState)
  }

  _getChannelState(channel) {
    return this._channelState[channel]
  }

  _setChannelState(channel, state) {
    this._channelState[channel] = state
  }

  _removeChannelState(channel) {
    this._channelState = Object.entries(this._channelState).reduce(
      (channelStates, [name, state]) => {
        return name === channel
          ? channelStates
          : { ...channelStates, [name]: state }
      },
      {},
    )
  }

  _clearChannelState() {
    this._channelState = {}
  }

  _handleMessage(baseMessage) {
    const channel = sanitizers.channel(baseMessage.channel)

    const selfUsername = get(this, '_userState.username', '')
    const messageUsername = get(baseMessage, 'username')
    const isSelf = selfUsername === messageUsername

    const preMessage = { ...baseMessage, isSelf }

    let eventName = preMessage.command
    let message = preMessage

    switch (preMessage.command) {
      case constants.EVENTS.JOIN: {
        message = parsers.joinMessage(preMessage)
        message.isSelf = true
        eventName = `${message.command}/${channel}`
        break
      }

      case constants.EVENTS.PART: {
        message = parsers.partMessage(preMessage)
        message.isSelf = true
        eventName = `${message.command}/${channel}`
        break
      }

      case constants.EVENTS.NAMES: {
        message = parsers.namesMessage(preMessage)
        message.isSelf = true
        eventName = `${message.command}/${channel}`
        break
      }

      case constants.EVENTS.NAMES_END: {
        message = parsers.namesEndMessage(preMessage)
        message.isSelf = true
        eventName = `${message.command}/${channel}`
        break
      }

      case constants.EVENTS.CLEAR_CHAT: {
        message = parsers.clearChatMessage(preMessage)
        eventName = message.event
          ? `${message.command}/${message.event}/${channel}`
          : `${message.command}/${channel}`
        break
      }

      case constants.EVENTS.HOST_TARGET: {
        message = parsers.hostTargetMessage(preMessage)
        eventName = `${message.command}/${channel}`
        break
      }

      case constants.EVENTS.MODE: {
        message = parsers.modeMessage(preMessage)
        eventName = `${message.command}/${channel}`

        if (selfUsername === message.username) {
          const channelState = this._getChannelState(channel)

          this._setChannelState(channel, {
            ...channelState,
            userState: {
              ...channelState.userState,
              isModerator: message.isModerator,
            },
          })
        }
        break
      }

      case constants.EVENTS.GLOBAL_USER_STATE: {
        message = parsers.globalUserStateMessage(preMessage)
        this._userState = message.tags
        break
      }

      case constants.EVENTS.USER_STATE: {
        message = parsers.userStateMessage(preMessage)
        eventName = `${message.command}/${channel}`

        this._setChannelState(channel, {
          ...this._getChannelState(channel),
          userState: message.tags,
        })
        break
      }

      case constants.EVENTS.ROOM_STATE: {
        message = parsers.roomStateMessage(preMessage)
        eventName = `${message.command}/${channel}`

        this._setChannelState(channel, {
          ...this._getChannelState(channel),
          roomState: message.roomState,
        })
        break
      }

      case constants.EVENTS.NOTICE: {
        message = parsers.noticeMessage(preMessage)
        eventName = `${message.command}/${message.event}/${channel}`
        break
      }

      case constants.EVENTS.USER_NOTICE: {
        message = parsers.userNoticeMessage(preMessage)
        eventName = `${message.command}/${message.event}/${channel}`
        break
      }

      case constants.EVENTS.PRIVATE_MESSAGE: {
        message = parsers.privateMessage(preMessage)
        eventName = message.event
          ? `${message.command}/${message.event}/${channel}`
          : `${message.command}/${channel}`
        break
      }

      default: {
        const command = chatUtils.getEventNameFromMessage(preMessage)
        eventName = channel === '#' ? command : `${command}/${channel}`
      }
    }

    this._emit(eventName, message)
  }

  _handleDisconnect() {
    this._connectionInProgress = null
    this._readyState = 5
  }
}

export { constants }
export default Chat