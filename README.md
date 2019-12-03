# [TwitchJS](https://twitch-js.github.io/twitch-js)

[![Travis branch](https://img.shields.io/travis/twitch-js/twitch-js/master.svg?longCache=true&style=flat-square)](https://travis-ci.org/twitch-js/twitch-js)
[![npm](https://img.shields.io/npm/v/twitch-js.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/twitch-js)
[![npm](https://img.shields.io/npm/v/twitch-js/next.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/twitch-js/v/next)
[![npm](https://img.shields.io/npm/dm/twitch-js.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/twitch-js)
[![GitHub issues](https://img.shields.io/github/issues/twitch-js/twitch-js.svg?longCache=true&style=flat-square)](https://github.com/twitch-js/twitch-js/issues)
[![Coverage Status](https://img.shields.io/codecov/c/github/twitch-js/twitch-js/next.svg?longCache=true&style=flat-square)](https://codecov.io/gh/twitch-js/twitch-js/branch/next)

A community-centric, community-supported Twitch JavaScript SDK.

## Warning

This branch is under active development; expect **breaking changes**. Please use
version pinning, refer to the diffs, and update accordingly to avoid
regressions.

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
[planned features](https://github.com/twitch-js/twitch-js/milestone/1). If you
feel something is missing, create an issue or submit a PR against the next
branch.

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
