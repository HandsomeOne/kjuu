import q from '../src'
import { transformRequest, QRequest } from '../src/core'

describe('Request', () => {
  beforeAll(() => {
    q.setOptions({
      baseUrl: 'http://a.com',
      responseType: undefined,
      headers: { foo: 'bar', baz: undefined },
    })
  })

  afterAll(() => {
    Object.defineProperty(q, 'defaults', { value: {} })
  })

  const f = (options?: QRequest) =>
    transformRequest(
      { url: '/', ...options },
      Object.getOwnPropertyDescriptor(q, 'defaults')!.value,
    )

  it('Basic', () => {
    const t = f()
    expect(t.url).toBe('http://a.com/')
    expect((t.init.headers as Record<string, string>)['foo']).toBe('bar')
    expect(t.init.headers).not.toContain('baz')
    expect(t.init.method!.toUpperCase()).toBe('GET')
    expect(t.responseType).toBe('json')
  })

  it('URLs', () => {
    expect(f({ url: 'http://b.com/' }).url).toBe('http://b.com/')
    expect(f({ url: '/api', baseUrl: undefined }).url).toBe('/api')
  })

  it('Params', () => {
    expect(f({ params: { id: 1 } }).url).toBe('http://a.com/?id=1')
    expect(
      f({
        url: '/?type=add',
        params: { id: 1 },
      }).url,
    ).toBe('http://a.com/?type=add&id=1')
  })

  it('Data', () => {
    const t = f({ body: q.JSON({ a: 1 }) })
    expect(t.init.method!.toUpperCase()).toBe('POST')
    expect(t.init.body).toBe('{"a":1}')
    expect((t.init.headers as Record<string, string>)['content-type']).toBe(
      'application/json',
    )
  })

  it('Credentials', () => {
    expect(f().init.credentials).toBe('same-origin')
    expect(f({ withCredentials: true }).init.credentials).toBe('include')
    expect(f({ withCredentials: false }).init.credentials).toBe('omit')
  })
})

describe('Response', () => {
  it('Basic', async () => {
    const res: any = await q.get('http://a.com/', {}, { responseType: 'text' })

    expect(res.status).toBe(200)
    expect(res).toHaveProperty('body')
    expect(res).toHaveProperty('headers')
    expect(res.body.length).toBe(+res.headers['content-length'])
    expect(res.body.length).toBe(+res.headers['cOnTeNt-LeNgTh'])
  })
})
