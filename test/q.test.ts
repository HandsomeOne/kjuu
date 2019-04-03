import q from '../src'

beforeAll(() => {
  q.setOptions({
    baseUrl: 'http://a.com',
    transformResponse: res => res && (res.body as any).data,
  })
})

afterAll(() => {
  Object.defineProperty(q, 'defaults', { value: {} })
})

it('Basic', async () => {
  expect(await q.request({ url: '/' })).toBe(42)
  expect(await q.request({})).toBe(42)
})

it('HTTP methods', async () => {
  expect(await q.get('/', { a: 1 })).toBe(42)
  expect(await q.head('/', { a: 1 })).toBe(42)
  expect(await q.post('/', q.JSON({ a: 1 }))).toBe(42)
  expect(await q.put('/', q.JSON({ a: 1 }))).toBe(42)
  expect(await q.patch('/', q.JSON({ a: 1 }))).toBe(42)
  expect(await q.delete('/', q.JSON({ a: 1 }))).toBe(42)
})

it('Make href', async () => {
  expect(await q.href('/', { a: 1 })).toBe('http://a.com/?a=1')
})
