export const CHAT_SERVER = 'irc-ws.chat.twitch.tv'
export const CHAT_SERVER_PORT = 6667
export const CHAT_SERVER_SSL_PORT = 443

/**
 * @constant
 * @type {number}
 * @default 5000
 */
export const CONNECTION_TIMEOUT = 5000
export const KEEP_ALIVE_PING_TIMEOUT = 55000
export const KEEP_ALIVE_RECONNECT_TIMEOUT = 60000
/**
 * @constant
 * @type {number}
 * @default 1000
 */
export const JOIN_TIMEOUT = 1000 // milliseconds.
export const COMMAND_TIMEOUT = 1000 // milliseconds.

export const CLIENT_PRIORITY = 100

// See https://dev.twitch.tv/docs/irc/guide/#command--message-limits.
export const RATE_LIMIT_USER = 40 // per minute.
export const RATE_LIMIT_MODERATOR = 200 // per minute.
export const RATE_LIMIT_KNOWN_BOT = 100 // per minute.
export const RATE_LIMIT_VERIFIED_BOT = 15000 // per minute.

export const QUEUE_TICK_RATE = 1000 // milliseconds.

export const ERROR_CONNECT_TIMED_OUT = 'ERROR: connect timed out'
export const ERROR_CONNECTION_IN_PROGRESS = 'ERROR: connection in progress'
export const ERROR_JOIN_TIMED_OUT = 'ERROR: join timed out'
export const ERROR_SAY_TIMED_OUT = 'ERROR: say timed out'
export const ERROR_COMMAND_TIMED_OUT = 'ERROR: command timed out'
export const ERROR_COMMAND_UNRECOGNIZED = 'ERROR: command unrecognized'
export const ERROR_PART_TIMED_OUT = 'ERROR: part timed out'

// See https://dev.twitch.tv/docs/irc/membership/.
export const MEMBERSHIP_COMMANDS = {
  JOIN: 'JOIN',
  MODE: 'MODE',
  PART: 'PART',
  NAMES: '353',
  NAMES_END: '366',
}

// See https://dev.twitch.tv/docs/irc/tags/.
export const TAG_COMMANDS = {
  CLEAR_CHAT: 'CLEARCHAT',
  GLOBAL_USER_STATE: 'GLOBALUSERSTATE',
  PRIVATE_MESSAGE: 'PRIVMSG',
  ROOM_STATE: 'ROOMSTATE',
  USER_NOTICE: 'USERNOTICE',
  USER_STATE: 'USERSTATE',
}

export const OTHER_COMMANDS = {
  PING: 'PING',
  PONG: 'PONG',
}

// See https://dev.twitch.tv/docs/irc/commands/.
export const COMMANDS = {
  ...OTHER_COMMANDS,
  ...MEMBERSHIP_COMMANDS,
  ...TAG_COMMANDS,

  CLEAR_CHAT: 'CLEARCHAT',
  HOST_TARGET: 'HOSTTARGET',
  NOTICE: 'NOTICE',
  RECONNECT: 'RECONNECT',
  ROOM_STATE: 'ROOMSTATE',
  USER_NOTICE: 'USERNOTICE',
  USER_STATE: 'USERSTATE',
}

// See https://dev.twitch.tv/docs/irc/commands/#msg-id-tags-for-the-notice-commands-capability.
export const NOTICE_MESSAGE_IDS = {
  ALREADY_BANNED: 'already_banned',
  ALREADY_EMOTE_ONLY_OFF: 'already_emote_only_off',
  ALREADY_EMOTE_ONLY_ON: 'already_emote_only_on',
  ALREADY_R9K_OFF: 'already_r9k_off',
  ALREADY_R9K_ON: 'already_r9k_on',
  ALREADY_SUBS_OFF: 'already_subs_off',
  ALREADY_SUBS_ON: 'already_subs_on',
  BAD_HOST_HOSTING: 'bad_host_hosting',
  BAN_SUCCESS: 'ban_success',
  BAD_UNBAN_NO_BAN: 'bad_unban_no_ban',
  EMOTE_ONLY_OFF: 'emote_only_off',
  EMOTE_ONLY_ON: 'emote_only_on',
  HOST_OFF: 'host_off',
  HOST_ON: 'host_on',
  HOSTS_REMAINING: 'hosts_remaining',
  MSG_CHANNEL_SUSPENDED: 'msg_channel_suspended',
  R9K_OFF: 'r9k_off',
  R9K_ON: 'r9k_on',
  ROOM_MODS: 'room_mods',
  SLOW_OFF: 'slow_off',
  SLOW_ON: 'slow_on',
  SUBS_OFF: 'subs_off',
  SUBS_ON: 'subs_on',
  TIMEOUT_SUCCESS: 'timeout_success',
  UNBAN_SUCCESS: 'unban_success',
  UNRECOGNIZED_COMMAND: 'unrecognized_cmd',
}

// See https://dev.twitch.tv/docs/irc/tags#usernotice-twitch-tags.
export const USER_NOTICE_MESSAGE_IDS = {
  RAID: 'raid',
  RESUBSCRIPTION: 'resub',
  RITUAL: 'ritual',
  SUBSCRIPTION_GIFT: 'subgift',
  SUBSCRIPTION: 'sub',
}

export const MESSAGE_IDS = {
  ...NOTICE_MESSAGE_IDS,
  ...USER_NOTICE_MESSAGE_IDS,
}

/**
 * Chat events
 * @readonly
 * @enum {string}
 * @property {string} RAW
 */
export const EVENTS = {
  ...COMMANDS,

  RAW: 'RAW',

  ALL: '*',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  ERROR_ENCOUNTERED: 'ERROR_ENCOUNTERED',
  PARSE_ERROR_ENCOUNTERED: 'PARSE_ERROR_ENCOUNTERED',

  RAID: 'RAID',
  RESUBSCRIPTION: 'RESUBSCRIPTION',
  RITUAL: 'RITUAL',
  SUBSCRIPTION_GIFT: 'SUBSCRIPTION_GIFT',
  SUBSCRIPTION: 'SUBSCRIPTION',

  ROOM_MODS: 'ROOM_MODS',
  MOD_GAINED: 'MOD_GAINED',
  MOD_LOST: 'MOD_LOST',

  USER_BANNED: 'USER_BANNED',

  CHANNEL_HOSTED: 'CHANNEL_HOSTED',
  CHANNEL_HOSTED_STOPPED: 'CHANNEL_HOSTED_STOPPED',
}

// See https://help.twitch.tv/customer/en/portal/articles/659095-chat-moderation-commands.
export const CHAT_COMMANDS = {
  ME: 'me',
  BAN: 'ban',
  CLEAR: 'clear',
  COLOR: 'color',
  COMMERCIAL: 'commercial',
  EMOTE_ONLY: 'emoteonly',
  EMOTE_ONLY_OFF: 'emoteonlyoff',
  FOLLOWERS_ONLY: 'followers',
  FOLLOWERS_ONLY_OFF: 'followersonlyoff',
  HOST: 'host',
  MOD: 'mod',
  MODS: 'mods',
  // PART: 'part',
  R9K: 'r9k',
  R9K_OFF: 'r9koff',
  SLOW: 'slow',
  SLOW_OFF: 'slowoff',
  SUBSCRIBERS: 'subscribers',
  SUBSCRIBERS_OFF: 'subscribersoff',
  TIMEOUT: 'timeout',
  UNBAN: 'unban',
  UNHOST: 'unhost',
  UNMOD: 'unmod',
  WHISPER: 'whisper',
}
