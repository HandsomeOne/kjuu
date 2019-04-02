import { QRequest, transformRequest, transformResponse } from './core'

import JSON from './contentTypes/JSON'
import URLSearchParams from './contentTypes/URLSearchParams'
import FormData from './contentTypes/FormData'
import mergeOptions from './mergeOptions'

declare global {
  namespace HTTP {
    interface ANY {}
    interface GET extends ANY {}
    interface HEAD extends ANY {}
    interface POST extends ANY {}
    interface PUT extends ANY {}
    interface PATCH extends ANY {}
    interface DELETE extends ANY {}
  }
}

interface HTTPMethodMap {
  get: HTTP.GET
  head: HTTP.HEAD
  post: HTTP.POST
  put: HTTP.PUT
  patch: HTTP.PATCH
  delete: HTTP.DELETE
}

interface HTTPMethodFn<
  T extends keyof HTTPMethodMap,
  K extends 'params' | 'body'
> {
  <U extends keyof HTTPMethodMap[T]>(
    url: U,
    payload?: QRequest[K],
    config?: QRequest | null,
  ): Promise<HTTPMethodMap[T][U]>

  (url: string, payload?: QRequest[K], config?: QRequest | null): Promise<
    unknown
  >
}

type Mock<T> = Record<string, unknown> &
  { [U in keyof T]?: T[U] | (() => T[U]) }

class Q {
  JSON = JSON
  URLSearchParams = URLSearchParams
  FormData = FormData

  private mocks: Record<
    'any' | keyof HTTPMethodMap,
    Record<string, unknown>
  > = {
    any: Object.create(null),
    get: Object.create(null),
    head: Object.create(null),
    post: Object.create(null),
    put: Object.create(null),
    patch: Object.create(null),
    delete: Object.create(null),
  }

  constructor(private defaults: QRequest) {}

  setOptions(options: QRequest) {
    Object.assign(this.defaults, options)
  }

  async request(options: QRequest) {
    const transformed = await transformRequest(options, this.defaults)

    return transformResponse(
      await fetch(transformed.url, transformed.init),
      transformed.responseType,
      transformed.transformResponse,
    )
  }

  private createHTTPMethodFn<
    T extends keyof HTTPMethodMap,
    K extends 'params' | 'body'
  >(method: T, payloadName: K): HTTPMethodFn<T, K> {
    return (url: string, payload?: QRequest[K], options?: QRequest | null) => {
      const mock = this.mocks[method][url] || this.mocks.any[url]
      if (mock) {
        const { mockDelay = [10, 100] } = this.defaults
        const delay =
          typeof mockDelay === 'number'
            ? mockDelay
            : mockDelay[0] + (mockDelay[1] - mockDelay[0]) * Math.random()

        return new Promise(resolve => {
          setTimeout(
            () => resolve(typeof mock === 'function' ? mock() : mock),
            delay,
          )
        })
      }

      return this.request({
        url,
        [payloadName]: payload,
        method,
        ...options,
      })
    }
  }

  get = this.createHTTPMethodFn('get', 'params')
  head = this.createHTTPMethodFn('head', 'params')

  post = this.createHTTPMethodFn('post', 'body')
  put = this.createHTTPMethodFn('put', 'body')
  patch = this.createHTTPMethodFn('patch', 'body')
  delete = this.createHTTPMethodFn('delete', 'body')

  href(url: string, params?: QRequest['params']) {
    return transformRequest({ url, params }, this.defaults).url
  }

  extend(options: QRequest = {}) {
    return new Q(mergeOptions(this.defaults, options))
  }

  useMock(mock: Mock<HTTP.ANY>): void
  useMock<T extends keyof HTTPMethodMap>(
    method: T,
    mock: Mock<HTTPMethodMap[T]>,
  ): void

  useMock(...args: unknown[]) {
    if (process.env.NODE_ENV !== 'development') return

    const method = args.length > 1 ? args[0] : 'any'
    const mocks = args.length > 1 ? args[1] : args[0]

    if (!isMethod(method)) throw new Error('方法名不合法: ' + method)
    if (!isRecord(mocks)) throw new Error('mocks 不是对象')

    Object.assign(this.mocks[method], mocks)
  }
}

function isMethod(arg: unknown): arg is 'any' | keyof HTTPMethodMap {
  return (
    typeof arg === 'string' &&
    ['any', 'get', 'head', 'post', 'put', 'patch', 'delete'].includes(arg)
  )
}

function isRecord(arg: unknown): arg is Record<string, unknown> {
  return typeof arg === 'object' && arg !== null
}

export const q = new Q({})
export default q
