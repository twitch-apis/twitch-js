import Queue from '../'

describe('Chat/Queue', () => {
  test('should call fn on push', done => {
    const queue = new Queue()
    queue.push({ fn: done })
  })

  test('should call multiple fn on push', done => {
    expect.assertions(2)

    const fnOne = jest.fn()
    const fnTwo = jest.fn()

    const queue = new Queue()

    queue._q.on('drain', () => {
      expect(fnOne).toHaveBeenCalledTimes(1)
      expect(fnTwo).toHaveBeenCalledTimes(1)
      done()
    })

    queue.push({ fn: fnOne })
    queue.push({ fn: fnTwo })
  })

  describe('rate-limiting', () => {
    const NativeDate = Date
    let d = new Date()

    beforeAll(() => {
      Object.assign(Date, NativeDate)
      global.Date = jest.fn(() => new NativeDate(d.toISOString()))
    })

    afterAll(() => {
      global.Date = NativeDate
    })

    test('should limit rate of fn calls', done => {
      const fn = jest.fn()

      const maxLength = 3
      const tickInterval = 2000
      const totalCalls = 10

      let numberOfTasksFinished = 0
      const onTaskFinished = () => {
        numberOfTasksFinished++
        expect(numberOfTasksFinished).toBe(numberOfTasksFinished)

        if (numberOfTasksFinished % maxLength === 0) {
          d.setMilliseconds(d.getMilliseconds() + tickInterval + 1)
        }

        if (numberOfTasksFinished === totalCalls) {
          done()
        }
      }

      const queue = new Queue({
        maxLength,
        tickInterval,
        onTaskFinished,
      })

      for (let i = 1; i <= totalCalls; i++) {
        queue.push({ fn })
      }
    })
  })
})
