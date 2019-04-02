import { QRequest } from './core'

export default (base: QRequest, options: QRequest): QRequest => ({
  ...base,
  ...options,
  headers: {
    ...base.headers,
    ...options.headers,
  },
})
