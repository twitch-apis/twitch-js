import { server } from 'ws'

import commands from '../../../__mocks__/ws/__fixtures__/commands'
import membership from '../../../__mocks__/ws/__fixtures__/membership'
import tags from '../../../__mocks__/ws/__fixtures__/tags'

import { onceResolve } from '../../utils'

import Chat, { constants } from '../index'
import parser from '../utils/parsers'

jest.mock('uws', () => require('ws'))

const emitHelper = (emitter, rawMessages) =>
  parser(rawMessages).forEach(message =>
    emitter.emit(constants.EVENTS.ALL, message),
  )

describe('Chat', () => {
  let realDate

  const options = {
    server: 'localhost',
    port: 6667,
    token: 'TOKEN',
    username: 'USERNAME',
    ssl: false,
  }

  beforeAll(() => {
    realDate = global.Date
    const DATE_TO_USE = new Date('2018')
    global.Date = jest.fn(() => DATE_TO_USE)
  })

  afterAll(() => {
    global.Date = realDate
  })

  test('should join channel', async () => {
    const chat = new Chat(options)
    await chat.connect()

    const actual = await chat.join('#dallas')
    expect(actual).toMatchSnapshot()
    expect(chat.getChannelState('#dallas')).toEqual(actual)
  })

  test('should send message to channel', async done => {
    const chat = new Chat(options)
    await chat.connect()

    expect.assertions(1)

    server.once('message', message => {
      expect(message).toEqual('PRIVMSG #dallas :Kappa Keepo Kappa')
      done()
    })

    chat.say('#dallas', 'Kappa Keepo Kappa')
  })

  test('should part a channel', async done => {
    const chat = new Chat(options)
    await chat.connect()

    expect.assertions(1)

    server.once('message', message => {
      expect(message).toEqual('PART #dallas')
      done()
    })

    chat.part('#dallas')
  })

  test('should disconnect', async done => {
    const chat = new Chat(options)
    await chat.connect()

    server.once('close', () => done())

    chat.disconnect()
  })

  test('should reconnect and rejoin channels', async () => {
    const chat = new Chat(options)
    await chat.connect()
    await chat.join('#dallas')

    const listener = jest.fn()
    server.on('close', () => listener('close'))
    server.on('open', () => listener('open'))
    server.on('message', listener)
    chat.on('*', listener)

    await chat.reconnect()

    expect(listener.mock.calls).toMatchSnapshot()

    server.removeListener('close')
    server.removeListener('open')
    server.removeListener('message')
  })

  test('should reconnect on RECONNECT event', async done => {
    const chat = new Chat(options)
    await chat.connect()

    chat.once('CONNECTED', () => done())

    chat._client.emit('RECONNECT')
  })

  describe('should handle messages', () => {
    test('JOIN', async done => {
      const chat = new Chat(options)
      await chat.connect()

      chat.once(constants.EVENTS.JOIN, message => {
        expect(message).toMatchSnapshot()
        done()
      })

      emitHelper(chat._client, membership.JOIN)
    })

    test('PART', async done => {
      const chat = new Chat(options)
      await chat.connect()

      chat.once(constants.EVENTS.PART, message => {
        expect(message).toMatchSnapshot()
        done()
      })

      emitHelper(chat._client, membership.PART)
    })

    test('NAMES', async () => {
      const chat = new Chat(options)
      await chat.connect()

      const emissions = Promise.all([
        onceResolve(chat, constants.COMMANDS.NAMES),
        onceResolve(chat, constants.COMMANDS.NAMES),
        onceResolve(chat, constants.COMMANDS.NAMES_END),
      ])

      emitHelper(chat._client, membership.NAMES)

      return emissions.then(actual => expect(actual).toMatchSnapshot())
    })

    describe('MODE', () => {
      describe('current user', () => {
        test('+o', async done => {
          const chat = new Chat(options)
          await chat.connect()
          await chat.join('#dallas')

          chat._channelState['#dallas'].userState.isModerator = false

          chat.once(constants.EVENTS.MODE, message => {
            expect(message).toMatchSnapshot()

            const actual = chat._channelState['#dallas'].userState.isModerator
            const expected = true
            expect(actual).toEqual(expected)
            done()
          })

          emitHelper(chat.client, membership.MODE.OPERATOR_PLUS_DALLAS)
        })

        test('-o', async done => {
          const chat = new Chat(options)
          await chat.connect()
          await chat.join('#dallas')

          chat._channelState['#dallas'].userState.isModerator = true

          chat.once(constants.EVENTS.MODE, message => {
            expect(message).toMatchSnapshot()

            const actual = chat._channelState['#dallas'].userState.isModerator
            const expected = false
            expect(actual).toEqual(expected)
            done()
          })

          await chat.join('#dallas')

          emitHelper(chat._client, membership.MODE.OPERATOR_MINUS_DALLAS)
        })
      })

      describe('another user', () => {
        test('+o', async done => {
          const chat = new Chat(options)
          await chat.connect()
          await chat.join('#dallas')

          const before = chat._channelState['#dallas'].userState.isModerator

          chat.once(constants.EVENTS.MODE, message => {
            expect(message).toMatchSnapshot()

            const after = chat._channelState['#dallas'].userState.isModerator
            expect(before).toEqual(after)
            done()
          })

          emitHelper(chat._client, membership.MODE.OPERATOR_PLUS_RONNI)
        })

        test('-o', async done => {
          const chat = new Chat(options)
          await chat.connect()
          await chat.join('#dallas')

          const before = chat._channelState['#dallas'].userState.isModerator

          chat.once(constants.EVENTS.MODE, message => {
            expect(message).toMatchSnapshot()

            const after = chat._channelState['#dallas'].userState.isModerator
            expect(before).toEqual(after)
            done()
          })

          emitHelper(chat._client, membership.MODE.OPERATOR_MINUS_RONNI)
        })
      })
    })

    test('CLEARCHAT', async done => {
      const chat = new Chat(options)
      await chat.connect()

      chat.once(constants.EVENTS.CLEAR_CHAT, message => {
        expect(message).toMatchSnapshot()
        done()
      })

      emitHelper(chat._client, commands.CLEARCHAT.CHANNEL)
    })

    test('CLEARCHAT user with reason', async done => {
      const chat = new Chat(options)
      await chat.connect()

      chat.once(constants.EVENTS.CLEAR_CHAT, message => {
        expect(message).toMatchSnapshot()
        done()
      })

      emitHelper(chat._client, commands.CLEARCHAT.USER_WITH_REASON)
    })

    test('HOSTTARGET start', async done => {
      const chat = new Chat(options)
      await chat.connect()

      chat.once(constants.EVENTS.HOST_TARGET, message => {
        expect(message).toMatchSnapshot()
        done()
      })

      emitHelper(chat._client, commands.HOSTTARGET.START)
    })

    test('HOSTTARGET stop', async done => {
      const chat = new Chat(options)
      await chat.connect()

      chat.once(constants.EVENTS.HOST_TARGET, message => {
        expect(message).toMatchSnapshot()
        done()
      })

      emitHelper(chat._client, commands.HOSTTARGET.STOP)
    })

    describe('NOTICE', () => {
      test.each(Object.entries(commands.NOTICE))(
        '%s',
        async (name, raw, done) => {
          const chat = new Chat(options)
          await chat.connect()

          chat.once(constants.EVENTS.NOTICE, message => {
            expect(message).toMatchSnapshot()
            done()
          })

          emitHelper(chat._client, raw)
        },
        5000,
      )
    })

    describe('USERNOTICE', () => {
      test.each(Object.entries(tags.USERNOTICE))(
        '%s',
        async (name, raw, done) => {
          const chat = new Chat(options)
          await chat.connect()

          chat.once(constants.COMMANDS.USER_NOTICE, message => {
            expect(message).toMatchSnapshot()
            done()
          })

          emitHelper(chat._client, raw)
        },
      )
    })

    describe('PRIVMSG', () => {
      test('PRIVMSG', async done => {
        const chat = new Chat(options)
        await chat.connect()

        expect.assertions(1)

        chat.once('PRIVMSG', actual => {
          expect(actual).toMatchSnapshot()
          done()
        })

        emitHelper(chat._client, tags.PRIVMSG.NON_BITS)
      })

      test('CHEER', async done => {
        const chat = new Chat(options)
        await chat.connect()

        expect.assertions(1)

        chat.once('PRIVMSG', actual => {
          expect(actual).toMatchSnapshot()
          done()
        })

        emitHelper(chat._client, tags.PRIVMSG.BITS)
      })
    })

    describe('deviations', () => {
      test('CLEARCHAT deviation 1', async done => {
        const chat = new Chat(options)
        await chat.connect()

        expect.assertions(1)

        chat.on('CLEARCHAT', actual => {
          expect(actual).toMatchSnapshot()
          done()
        })

        emitHelper(chat._client, commands.CLEARCHAT.DEVIATION_1)
      })
    })
  })

  describe('should handle multiple channels', () => {
    // test('should join multiple channels', () => {})
    // test('should broadcast message to all channels', () => {})
  })
})