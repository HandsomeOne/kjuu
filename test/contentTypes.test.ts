import q from '../src'

const data = {
  string: 'some text',
  number: 0,
  array: [1, 2, 3],
  boolean: true,
  null: null,
  nested: {
    key: 'value',
  },
  deepArray: [[2]],
  deepObject: [[{ key: 'value' }]],
}

it('JSON', () => {
  const test = q.JSON(data)
  expect(test.toString()).toEqual(JSON.stringify(data))
})

it('URLSearchParams', () => {
  expect(q.URLSearchParams()).toBeInstanceOf(URLSearchParams)

  const t = new URLSearchParams()
  expect(q.URLSearchParams(t)).toBe(t)

  const test = q.URLSearchParams(data)
  expect(test.get('string')).toBe('some text')
  expect(test.get('number')).toBe('0')
  expect(test.get('boolean')).toBe('true')
  expect(test.has('null')).toBe(false)
  expect(test.has('array')).toBe(false)
  expect(test.get('array[1]')).toEqual('2')
  expect(test.get('deepArray[0][0]')).toBe('2')
  expect(test.get('deepObject[0][0][key]')).toBe('value')
})

it('FormData', () => {
  expect(q.FormData()).toBeInstanceOf(FormData)

  const t = new FormData()
  expect(q.FormData(t)).toBe(t)

  const test = q.FormData({ ...data, blob: new Blob() })
  expect(test.get('string')).toBe('some text')
  expect(test.get('number')).toBe('0')
  expect(test.get('boolean')).toBe('true')
  expect(test.has('null')).toBe(false)
  expect(test.has('array')).toBe(false)
  expect(test.get('array[1]')).toEqual('2')
  expect(test.get('deepArray[0][0]')).toBe('2')
  expect(test.get('deepObject[0][0][key]')).toBe('value')
  expect(test.get('blob')).toBeInstanceOf(Blob)
})
