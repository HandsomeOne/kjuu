import * as fetchMock from 'fetch-mock'

fetchMock.mock('http://a.com/error', { code: 1, data: 'error' })
fetchMock.mock('http://a.com/notjson', 'NOT JSON')
fetchMock.mock('begin:http://a.com/reflect/', url =>
  url.replace('http://a.com/reflect/', ''),
)
fetchMock.mock('begin:http://a.com/', { code: 0, data: 42 })
