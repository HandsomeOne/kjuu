import q from '../src'

const { NODE_ENV } = process.env
beforeAll(() => {
  process.env.NODE_ENV = 'development'

  q.setOptions({
    baseUrl: 'http://a.com',
    transformResponse: res => res && res.body.data,
    mockDelay: [0, 10],
  })

  q.useMock({
    '/method': () => ({ method: 'any' }),
  })
  q.useMock('get', {
    '/method': () => ({ method: 'get' }),
    '/test': () => ({ message: 'hello' }),
    '/newapi': () => 1,
  })
  q.useMock('post', {
    '/test': () => ({ id: 1 }),
  })
  q.useMock('put', {
    '/test': { id: 1 },
  })
  q.useMock('delete', {
    '/': () => 'success',
  })
})

afterAll(() => {
  process.env.NODE_ENV = NODE_ENV

  Object.defineProperty(q, 'defaults', { value: {} })
  Object.defineProperty(q, 'mockOptions', { value: {} })
  Object.defineProperty(q, 'mocks', { value: {} })
})

it('Basic', async () => {
  expect(((await q.get('/method')) as any).method).toBe('get')
  expect(((await q.post('/method')) as any).method).toBe('any')

  q.setOptions({ mockDelay: 0 })
  expect(((await q.get('/test')) as any).message).toBe('hello')
  expect(((await q.post('/test')) as any).id).toBe(1)
  expect(((await q.put('/test')) as any).id).toBe(1)
  expect(await q.get('/newapi')).toBe(1)

  q.setOptions({ mockDelay: undefined })
  expect(await q.delete('/')).toBe('success')
  expect(await q.get('/')).toBe(42)
})
