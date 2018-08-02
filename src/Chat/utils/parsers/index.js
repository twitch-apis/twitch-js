import { parse } from 'irc-message'
import camelcaseKeys from 'camelcase-keys'

import { isEmpty, isFinite, toNumber, toUpper } from 'lodash'

import * as constants from '../../constants'
import * as utils from '../'
import * as typeParsers from './types'
import * as tagParsers from './tags'

const base = rawMessages => {
  const rawMessagesV = rawMessages
    .replace(/[\r\n]+/g, '\n')
    .replace(/\n+$/g, '')
    .split(/\n/g)

  return rawMessagesV.map(rawMessage => {
    const { raw, tags, command, params: [channel, message] } = parse(rawMessage)

    /**
     * Base message parsed from Twitch
     * @mixin BaseMessage
     * @property {string} _raw Un-parsed message
     * @property {Date} timestamp Timestamp
     * @property {string} command Command
     * @property {(ClearChatTags|GlobalUserStateTags|PrivateMessageTags|RoomStateTags|UserNoticeTags|UserStateTags)} tags Twitch tags
     * @property {string} [channel] Channel
     * @property {string} [message] Message
     * @property {string} [event] Associated event
     */
    return {
      _raw: raw,
      timestamp: typeParsers.generalTimestamp(
        parseInt(tags['tmi-sent-ts'], 10),
      ),
      command,
      channel,
      tags: isEmpty(tags) ? undefined : camelcaseKeys(tags),
      message,
    }
  })
}

const joinOrPartMessage = baseMessage => {
  const [
    ,
    username,
    ,
    ,
    command,
    channel,
  ] = /:(.+)!(.+)@(.+).tmi.twitch.tv (JOIN|PART) (#.+)/g.exec(baseMessage._raw)

  /**
   * Join a channel.
   * @event Chat#JOIN
   * @mixes BaseMessage JoinOrPartMessage
   * @property {string} username Username (lower-case)
   * @see https://dev.twitch.tv/docs/irc/membership/#join-twitch-membership
   */
  /**
   * Depart from a channel.
   * @event Chat#PART
   * @mixes BaseMessage JoinOrPartMessage
   * @property {string} username Username (lower-case)
   * @see https://dev.twitch.tv/docs/irc/membership/#part-twitch-membership
   */
  return {
    ...baseMessage,
    channel,
    command,
    username,
    message: undefined,
  }
}

const modeMessage = baseMessage => {
  const [
    ,
    channel,
    mode,
    username,
  ] = /:[^\s]+ MODE (#[^\s]+) (-|\+)o ([^\s]+)/g.exec(baseMessage._raw)

  const isModerator = mode === '+'

  /**
   * Gain/lose moderator (operator) status in a channel.
   * @event Chat#MODE
   * @mixes BaseMessage ModeMessage
   * @property {string} event
   * @property {string} username
   * @property {boolean} isModerator
   * @see https://dev.twitch.tv/docs/irc/membership/#mode-twitch-membership
   */
  return {
    ...baseMessage,
    event: isModerator
      ? constants.EVENTS.MOD_GAINED
      : constants.EVENTS.MOD_LOST,
    channel,
    username,
    message: undefined,
    isModerator,
  }
}

const namesMessage = baseMessage => {
  const [
    ,
    ,
    ,
    channel,
    names,
  ] = /:(.+).tmi.twitch.tv 353 (.+) = (#.+) :(.+)/g.exec(baseMessage._raw)

  const namesV = names.split(' ')

  /**
   * List current chatters in a channel.
   * @event Chat#NAMES
   * @mixes BaseMessage NamesMessage
   * @property {Array<string>} usernames Array of usernames present in channel
   * @property {('mods'|'chatters')} listType
   * @see https://dev.twitch.tv/docs/irc/membership/#names-twitch-membership
   */
  return {
    ...baseMessage,
    channel,
    event: constants.EVENTS.NAMES,
    usernames: namesV,
    listType: names.length > 1000 ? 'mods' : 'chatters',
    message: undefined,
  }
}

const namesEndMessage = baseMessage => {
  const [
    ,
    username,
    ,
    channel,
    message,
  ] = /:(.+).tmi.twitch.tv 366 (.+) (#.+) :(.+)/g.exec(baseMessage._raw)

  /**
   * End of list current chatters in a channel.
   * @event Chat#NAMES_END
   * @mixes BaseMessage NamesEndMessage
   * @see https://dev.twitch.tv/docs/irc/membership/#names-twitch-membership
   */
  return {
    ...baseMessage,
    channel,
    event: constants.EVENTS.NAMES_END,
    username,
    message,
  }
}

const globalUserStateMessage = baseMessage => {
  const { tags, ...other } = baseMessage

  /**
   * GLOBALUSERSTATE message
   * @mixin GlobalUserStateMessage
   * @mixes BaseMessage
   * @property {GlobalUserStateTags} tags
   */
  /**
   * On successful login.
   * @event Chat#GLOBALUSERSTATE
   * @mixes GlobalUserStateMessage
   */
  return {
    tags: tagParsers.globalUserState(tags),
    ...other,
  }
}

const clearChatMessage = baseMessage => {
  const { tags, message: username, ...other } = baseMessage

  if (typeof username !== 'undefined') {
    /**
     * Temporary or permanent ban on a channel.
     * @event Chat#CLEARCHAT/USER_BANNED
     * @mixes BaseMessage ClearChatUserBannedMessage
     * @property {ClearChatTags} tags
     * @property {string} username
     * @see https://dev.twitch.tv/docs/irc/commands/#clearchat-twitch-commands
     * @see https://dev.twitch.tv/docs/irc/tags/#clearchat-twitch-tags
     */
    return {
      ...other,
      tags: {
        ...tags,
        banReason: typeParsers.generalString(tags.banReason),
        banDuration: typeParsers.generalNumber(tags.banDuration),
      },
      event: constants.EVENTS.USER_BANNED,
      username,
    }
  }

  /**
   * All chat is cleared (deleted).
   * @event Chat#CLEARCHAT
   * @mixes BaseMessage ClearChatMessage
   * @see https://dev.twitch.tv/docs/irc/commands/#clearchat-twitch-commands
   * @see https://dev.twitch.tv/docs/irc/tags/#clearchat-twitch-tags
   */
  return {
    ...other,
  }
}

const hostTargetMessage = baseMessage => {
  const [
    ,
    channel,
    username,
    numberOfViewers,
  ] = /:tmi.twitch.tv HOSTTARGET (#[^\s]+) :([^\s]+)?\s?(\d+)?/g.exec(
    baseMessage._raw,
  )
  const isStopped = username === '-'

  /**
   * Host starts or stops a message.
   * @event Chat#HOSTTARGET
   * @mixes BaseMessage HostTargetMessage
   * @property {number} [numberOfViewers] Number of viewers
   * @see https://dev.twitch.tv/docs/irc/commands/#hosttarget-twitch-commands
   */
  return {
    ...baseMessage,
    channel,
    username,
    event: toUpper(
      isStopped
        ? constants.NOTICE_MESSAGE_IDS.HOST_OFF
        : constants.NOTICE_MESSAGE_IDS.HOST_ON,
    ),
    numberOfViewers: isFinite(toNumber(numberOfViewers))
      ? parseInt(numberOfViewers, 10)
      : undefined,
    message: undefined,
  }
}

const roomStateMessage = baseMessage => {
  const { tags, ...other } = baseMessage

  /**
   * When a user joins a channel or a room setting is changed.
   * @event Chat#ROOMSTATE
   * @mixes BaseMessage RoomStateMessage
   * @property {RoomStateTags} tags
   */
  return {
    tags: tagParsers.roomState(tags),
    ...other,
  }
}

const noticeMessage = baseMessage => {
  const { tags: baseTags, ...other } = baseMessage

  const tags = utils.isAuthenticationFailedMessage(baseMessage)
    ? { ...baseTags, msgId: constants.EVENTS.AUTHENTICATION_FAILED }
    : baseTags

  const event = toUpper(tags.msgId)

  switch (tags.msgId) {
    case constants.NOTICE_MESSAGE_IDS.ROOM_MODS:
      /**
       * NOTICE/ROOM_MODS message
       * @event Chat#NOTICE/ROOM_MODS
       * @mixes NoticeMessage NoticeMessage
       * @property {'ROOM_MODS'} event
       * @property {Array<string>} mods
       */
      return { event, tags, mods: typeParsers.mods(other.message), ...other }
    default:
      /**
       * @event Chat#NOTICE
       * @mixes NoticeMessage
       * @property {string} event `msg-id` tag (snake uppercase)
       * @property {Object} tags
       * @see https://dev.twitch.tv/docs/irc/commands/#msg-id-tags-for-the-notice-commands-capability
       */

      /**
       * NOTICE message
       * @mixin NoticeMessage
       * @property {string} event `msg-id` tag (snake uppercase)
       * @property {Object} tags
       */
      return { event, tags, ...other }
  }
}

const userStateMessage = baseMessage => {
  const { tags, ...other } = baseMessage

  /**
   * USERSTATE message
   * @mixin UserStateMessage
   * @mixes BaseMessage
   * @property {UserStateTags} tags
   */
  /**
   * When a user joins a channel or sends a PRIVMSG to a channel.
   * @event Chat#USERSTATE
   * @mixes UserStateMessage UserStateMessage
   */
  return {
    tags: tagParsers.userState(tags),
    ...other,
    ...typeParsers.cheerEvent(tags.bits),
  }
}

/**
 * When a user joins a channel or sends a PRIVMSG to a channel.
 * @event Chat#PRIVMSG
 * @mixes UserStateMessage PrivateMessage
 * @property {'CHEER'} [event]
 * @property {string} [event]
 * @property {number} [bits]
 */
const privateMessage = userStateMessage

const userNoticeMessage = baseMessage => {
  const tags = tagParsers.userNotice(baseMessage.tags)

  switch (tags.msgId) {
    case constants.USER_NOTICE_MESSAGE_IDS.SUBSCRIPTION:
      /**
       * On subscription (first month) to a channel.
       * @event Chat#USERNOTICE/SUBSCRIPTION
       * @mixes UserStateMessage UserNoticeSubscriptionMessage
       * @property {'SUBSCRIPTION'} event
       * @property {string} systemMessage
       * @property {string} months
       * @property {string} subPlan
       * @property {string} subPlanName
       */
      return {
        ...baseMessage,
        tags,
        event: constants.EVENTS.SUBSCRIPTION,
        systemMessage: typeParsers.generalString(tags.systemMsg),
        months: tags.msgParamMonths,
        subPlan: tags.msgParamSubPlan,
        subPlanName: typeParsers.generalString(tags.msgParamSubPlanName),
      }
    case constants.USER_NOTICE_MESSAGE_IDS.RESUBSCRIPTION:
      /**
       * On resubscription (subsequent months) to a channel.
       * @event Chat#USERNOTICE/RESUBSCRIPTION
       * @mixes UserNoticeSubscriptionMessage UserNoticeResubscriptionMessage
       * @property {'RESUBSCRIPTION'} event
       */
      return {
        ...baseMessage,
        tags,
        event: constants.EVENTS.RESUBSCRIPTION,
        systemMessage: typeParsers.generalString(tags.systemMsg),
        months: tags.msgParamMonths,
        subPlan: tags.msgParamSubPlan,
        subPlanName: typeParsers.generalString(tags.msgParamSubPlanName),
      }
    case constants.USER_NOTICE_MESSAGE_IDS.SUBSCRIPTION_GIFT:
      /**
       * On subscription gift to a channel.
       * @event Chat#USERNOTICE/SUBSCRIPTION_GIFT
       * @mixes UserStateMessage UserNoticeSubscriptionGiftMessage
       * @property {'SUBSCRIPTION_GIFT'} event
       * @property {string} systemMessage
       * @property {string} recipientDisplayName
       * @property {string} recipientId
       * @property {string} recipientUserName
       */
      return {
        ...baseMessage,
        tags,
        event: constants.EVENTS.SUBSCRIPTION_GIFT,
        systemMessage: typeParsers.generalString(tags.systemMsg),
        recipientDisplayName: tags.msgParamRecipientDisplayName,
        recipientId: tags.msgParamRecipientId,
        recipientUserName: tags.msgParamRecipientName,
      }
    case constants.USER_NOTICE_MESSAGE_IDS.RAID:
      /**
       * On channel raid.
       * @event Chat#USERNOTICE/RAID
       * @mixes UserStateMessage UserNoticeRaidMessage
       * @property {'RAID'} event
       * @property {string} systemMessage
       * @property {string} raiderDisplayName
       * @property {string} raiderUserName
       * @property {string} raiderViewerCount
       */
      return {
        ...baseMessage,
        tags,
        event: constants.EVENTS.RAID,
        systemMessage: typeParsers.generalString(tags.systemMsg),
        raiderDisplayName: tags.msgParamDisplayName,
        raiderUserName: tags.msgParamLogin,
        raiderViewerCount: tags.msgParamViewerCount,
      }
    case constants.USER_NOTICE_MESSAGE_IDS.RITUAL:
      /**
       * On channel ritual.
       * @event Chat#USERNOTICE/RITUAL
       * @mixes UserStateMessage UserNoticeRitualMessage
       * @property {'RITUAL'} event
       * @property {string} systemMessage
       * @property {string} ritualName
       */
      return {
        ...baseMessage,
        tags,
        event: constants.EVENTS.RITUAL,
        systemMessage: typeParsers.generalString(tags.systemMsg),
        ritualName: tags.msgParamRitualName,
      }
    default:
      return { ...baseMessage, tags }
  }
}

export {
  modeMessage,
  hostTargetMessage,
  joinOrPartMessage,
  namesMessage,
  namesEndMessage,
  clearChatMessage,
  globalUserStateMessage,
  userStateMessage,
  roomStateMessage,
  noticeMessage,
  userNoticeMessage,
  privateMessage,
}
export default base
