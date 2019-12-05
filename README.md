<p align="center">
  <img width="128" src="media/logo.svg">
</p>

# [TwitchJS](https://twitch-js.github.io/twitch-js)

[![Travis branch](https://img.shields.io/travis/twitch-js/twitch-js/master.svg?longCache=true&style=flat-square)](https://travis-ci.org/twitch-js/twitch-js)
[![npm](https://img.shields.io/npm/v/twitch-js.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/twitch-js)
[![npm](https://img.shields.io/npm/v/twitch-js/next.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/twitch-js/v/next)
[![npm](https://img.shields.io/npm/dm/twitch-js.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/twitch-js)
[![GitHub issues](https://img.shields.io/github/issues/twitch-js/twitch-js.svg?longCache=true&style=flat-square)](https://github.com/twitch-js/twitch-js/issues)
[![Coverage Status](https://img.shields.io/codecov/c/github/twitch-js/twitch-js/next.svg?longCache=true&style=flat-square)](https://codecov.io/gh/twitch-js/twitch-js/branch/next)

A community-centric, community-supported Twitch JavaScript SDK.

## Features

- Aligns with official
  [Twitch IRC documentation](https://dev.twitch.tv/docs/irc/)
- Forward-compatible, low-level, minimally-assertive architecture
- Supports Node environments
- Supports Browsers
- Supports TypeScript
- Connect to multiple channels
- Chat commands
- Rate limiter

### In progress...

Here are the
[planned features](https://github.com/twitch-js/twitch-js/milestones). If you
feel something is missing, create an issue or submit a PR against the next
branch.

## Documentation

1. [Getting started](#getting-started)
2. [Authentication](#authentication)
3. [Examples](#examples)
4. [Interacting with Twitch chat](https://twitch-js.netlify.com/classes/chat.html)
5. [Making requests to Twitch API](https://twitch-js.netlify.com/classes/api.html)
6. [Reference](https://twitch-js.netlify.com/globals.html)

## Getting started

### Module bundler (CJS/ESM)

If you are using a module bundler, such [Webpack](https://webpack.js.org/),
[Browserify](http://browserify.org/), or a in a Node environment:

1. Add TwitchJS to your project:
   ```bash
   npm install --save twitch-js@next
   ```
2. Import TwitchJS

   ```js
   // ES2015 syntax
   import Twitch from 'twitch-js'

   // OR ES5 syntax
   var Twitch = require('twitch-js')

   const twitch = new Twitch({ username, token })
   ```

### Browser (IIFE)

If you are not using a module bundler, precompiled builds are available in the
[`dist` folder](https://unpkg.com/twitch-js@>2.0.0-beta/dist/):

1. Include a script tag in your HTML:
   ```html
   <script src="//unpkg.com/twitch-js@>2.0.0-beta/dist/index.js"></script>
   ```
2. Consume the library:
   ```html
   <script type="javascript">
     const twitchJs = new window.TwitchJs({ username, token })
   </script>
   ```

## Authentication

### Obtaining a client ID

To obtain a client ID, follow the
[instructions](https://dev.twitch.tv/docs/authentication/#registration) found in
the [Twitch Developers documentation](https://dev.twitch.tv/docs).

### Obtaining a token

With a client ID,
[tokens may be generated](https://dev.twitch.tv/docs/authentication/#getting-tokens)
on behalf of your users.

To quickly get started without a client ID, you may generate token using the
following, community-maintained, sites:

1. [Twitch Chat OAuth Password Generator](https://twitchapps.com/tmi)
   (Kraken/v5)
2. [Twitch Token Generator](https://twitchtokengenerator.com) (Helix)

### Refreshing tokens

While, Kraken/v5 tokens currently do not expire, Helix tokens expire and will
need to be refreshed.

To help with refreshing tokens, an `onAuthenticationFailure` function may be
provided to the Messaging and API clients. `onAuthenticationFailure()` must
return a `Promise` that resolves with the refreshed token. Upon resolution, any
actions that yielded a an _expired token_ response will be retried with the new,
refreshed token.

#### Handling token refresh example

```js
// Optionally, use fetchUtil to help.
import fetchUtil from 'twitch-js/lib/utils/fetch'

const refreshToken = 'eyJfaWQmNzMtNGCJ9%6VFV5LNrZFUj8oU231/3Aj'
const clientId = 'fooid'
const secret = 'barbazsecret'

const onAuthenticationFailure = () =>
  fetchUtil('https://id.twitch.tv/oauth2/token', {
    method: 'post',
    search: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    },
  }).then(response => response.access_token)

const token = 'cfabdegwdoklmawdzdo98xt2fo512y'
const username = 'ronni'
const twitchJs = new TwitchJs({ token, username, onAuthenticationFailure })

twitchJs.chat.connect().then(globalUserState => {
  // Do stuff ...
})
```

See
[Refreshing access tokens](https://dev.twitch.tv/docs/authentication/#refreshing-access-tokens)
for more information.

### More information

See the
[Twitch Developers documentation](https://dev.twitch.tv/docs/authentication) for
more information on authentication.

## Examples

Please see the `examples` folder for browser, Node and TypeScript examples.

## Contribution guidelines

If you wish to contribute, please see the
[CONTRIBUTING](https://github.com/twitch-js/twitch-js/blob/master/CONTRIBUTING.md)
doc.

## Special thanks

[Schmoopiie](https://github.com/Schmoopiie) and all the
[original contributors](https://github.com/tmijs/tmi.js/graphs/contributors) of
`tmi.js`.

## License

MIT

TwitchJS is not affiliated, associated, authorized, endorsed by, or in any way
officially connected with [Twitch](https://www.twitch.tv/), or any of its
subsidiaries or its affiliates. The name "Twitch" as well as related names,
marks, emblems and images are registered trademarks of
[Twitch](https://www.twitch.tv/).
