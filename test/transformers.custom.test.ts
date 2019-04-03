import q from '../src'
import { transformRequest, QRequest } from '../src/core'

describe('Request', () => {
  let isProduction = false
  function transformURL(url: string = '') {
    const base = isProduction ? 'http://a.com' : 'http://test.a.com'
    try {
      const parsed = new URL(url)
      if (isProduction && parsed.hostname.endsWith('a.com')) {
        return new URL(parsed.pathname + parsed.search, base).toString()
      }
    } catch {
      return new URL(url, base).toString()
    }
    return url
  }

  const token = Math.floor(Math.random() * (1 << 24)).toString(16)
  const defaults: QRequest = {
    transformRequest: options => {
      options.url = transformURL(options.url)
      if (isProduction) {
        options.headers!['X-CSRF-TOKEN'] = token
      }
      return options
    },
  }

  async function getURL(url: string) {
    return (await transformRequest({ url }, defaults)).url
  }

  it('Development env', async () => {
    isProduction = false
    expect(await getURL('/api')).toBe('http://test.a.com/api')
    expect(await getURL('http://dev.a.com/api')).toBe('http://dev.a.com/api')
    expect(await getURL('http://b.com/api')).toBe('http://b.com/api')
    expect(
      (await transformRequest({ url: '/' }, defaults)).init.headers,
    ).not.toHaveProperty('X-CSRF-TOKEN')
  })

  it('Production env', async () => {
    isProduction = true
    expect(await getURL('/api')).toBe('http://a.com/api')
    expect(await getURL('http://dev.a.com/api')).toBe('http://a.com/api')
    expect(await getURL('http://b.com/api')).toBe('http://b.com/api')
    expect(
      ((await transformRequest({ url: '/' }, defaults)).init.headers as Record<
        string,
        string
      >)['X-CSRF-TOKEN'],
    ).toBe(token)
  })

  it('No transform', async () => {
    isProduction = true
    expect(
      (await transformRequest({ url: '/', transformRequest: null }, defaults))
        .init.headers,
    ).not.toHaveProperty('X-CSRF-TOKEN')
  })
})

describe('Response', () => {
  beforeAll(() => {
    q.setOptions({
      baseUrl: 'http://a.com',
      transformResponse(res, error) {
        if (error) {
          return error
        }
        if (res) {
          const json = res.body as any
          if (+json.code === 0) {
            return json.data
          } else {
            throw json
          }
        }
      },
    })
  })

  afterAll(() => {
    Object.defineProperty(q, 'defaults', { value: {} })
  })

  it('Basic', async () => {
    expect(await q.get('/')).toBe(42)
  })

  it('Error', async () => {
    await expect(q.get('/error')).rejects.toHaveProperty('code')
  })

  it('Not JSON', async () => {
    await expect(q.get('/notjson')).resolves.toBeInstanceOf(Error)
    await expect(
      q.get('/notjson', null, { transformResponse: null }),
    ).rejects.toThrow()
  })

  it('No transform', async () => {
    await expect(
      q.request({ url: '/', transformResponse: null }),
    ).resolves.toHaveProperty('headers')
  })
})
