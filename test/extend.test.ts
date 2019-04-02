import q from '../src'

it('Basic', async () => {
  const q1 = q.extend({
    baseUrl: 'http://a.com/reflect/q1',
    responseType: 'text',
  })
  expect(((await q1.get('')) as any).body).toBe('q1')

  const q2 = q.extend({
    baseUrl: 'http://a.com/reflect/q2',
    responseType: 'text',
  })
  expect(((await q2.get('')) as any).body).toBe('q2')

  const q3 = q1.extend({
    baseUrl: 'http://a.com/reflect/q3',
  })
  expect(((await q3.get('')) as any).body).toBe('q3')

  const q4 = q2.extend({ mockDelay: 0 })
  expect(((await q4.get('')) as any).body).toBe('q2')
})
