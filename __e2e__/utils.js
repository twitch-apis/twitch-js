const conformsTo = require('lodash/conformsTo')
const isString = require('lodash/isString')

exports.preflight = () => {
  const shape = {
    TWITCH_USERNAME: isString,
    TWITCH_CLIENT_ID: isString,
    TWITCH_ACCESS_TOKEN: isString,
    TWITCH_REFRESH_TOKEN: isString,
  }

  if (!conformsTo(process.env, shape)) {
    throw new Error('Missing environment variable(s)')
  }
}
