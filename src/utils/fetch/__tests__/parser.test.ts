import parser from '../parser'

describe('parser', () => {
  const mockJsonResponse = { data1: 'DATA_1' }
  const mockResponse = {
    status: 200,
    ok: true,
    url: 'URL',
    statusText: 'OK',
    json: () => Promise.resolve(mockJsonResponse),
  }

  const mockJsonResponseError = { error: true }
  const mockResponseError = {
    status: 404,
    ok: false,
    url: 'URL',
    statusText: 'NOT OK',
    json: () => Promise.resolve(mockJsonResponseError),
  }

  test('should return response on successful response', async () => {
    const actual = await parser(mockResponse)
    const expected = mockJsonResponse

    expect(actual).toEqual(expected)
  })

  test('should throw on unsuccessful response', async () => {
    const actual = parser(mockResponseError)

    await expect(actual).rejects.toThrow()
    await expect(actual).rejects.toBeInstanceOf(Error)
    await expect(actual).rejects.toMatchInlineSnapshot(
      `[Error: [TwitchJS] URL NOT OK]`,
    )
  })
})
