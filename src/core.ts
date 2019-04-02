import { JASON } from './contentTypes/JSON'
import _URLSearchParams, { ParamsInit } from './contentTypes/URLSearchParams'
import mergeOptions from './mergeOptions'

export type responseType = 'arrayBuffer' | 'blob' | 'json' | 'text' | 'formData'
export interface QRequest
  extends Pick<
    RequestInit,
    Exclude<keyof RequestInit, 'body' | 'headers' | 'method'>
  > {
  url?: string
  method?: string
  baseUrl?: string
  headers?: Record<string, string | undefined | null>
  params?: URLSearchParams | ParamsInit | null
  body?: JASON | BodyInit | null
  withCredentials?: boolean

  responseType?: responseType
  transformRequest?: ((options: QRequest) => QRequest) | null
  transformResponse?:
    | ((response?: QResponse, error?: unknown) => unknown)
    | null
  mockDelay?: number | [number, number]
}

export interface QResponse<T = unknown>
  extends Pick<
    Response,
    'ok' | 'redirected' | 'status' | 'statusText' | 'url' | 'type'
  > {
  body: T
  headers: Record<string, string | undefined>
}

export function transformRequest(
  options: QRequest,
  defaults: QRequest,
): {
  url: string
  init: RequestInit
  responseType: responseType
  transformResponse: QRequest['transformResponse']
} {
  options = mergeOptions(defaults, options)

  if (options.transformRequest) {
    options = options.transformRequest(options)
  }

  let {
    url = '',
    method = 'get',
    baseUrl,
    params: rawParams,
    body,
    headers,
    withCredentials,
    responseType = 'json' as 'json',
    transformRequest,
    transformResponse,
    mockDelay,
    ...rest
  } = options as QRequest & {
    headers: NonNullable<QRequest['headers']>
  }

  try {
    url = new URL(url, baseUrl).toString()
  } catch {
    // do nothing
  }

  const params = _URLSearchParams(defaults.params)
  _URLSearchParams(rawParams).forEach((value: string, key: string) => {
    params.append(key, value)
  })
  const search = params.toString()
  if (search) {
    url += url.includes('?') ? '&' : '?'
    url += search
  }

  if (
    body &&
    (method.toLowerCase() === 'get' || method.toLowerCase() === 'head')
  ) {
    method = 'post'
  }

  Object.keys(headers).forEach(key => {
    const value = headers[key]
    if (value === undefined || value === null) {
      delete headers[key]
    }
  })

  if (body instanceof JASON) {
    body = body.toString()
    headers['content-type'] = 'application/json'
  }

  return {
    url,
    responseType,
    transformResponse,
    init: {
      ...rest,
      body,
      method: method.toUpperCase(),
      headers: headers as Record<string, string>,
      credentials:
        withCredentials === undefined
          ? 'same-origin'
          : withCredentials
          ? 'include'
          : 'omit',
    },
  }
}

export async function transformResponse(
  res: Response,
  responseType: responseType,
  transformResponse: QRequest['transformResponse'],
) {
  const headers: Record<string, string> = {}
  res.headers.forEach((value: string, name: string) => {
    headers[name] = value
  })

  const headersProxy = new Proxy(headers, {
    get(target, prop) {
      return target[prop.toString().toLowerCase()]
    },
  })

  let body: unknown
  try {
    body = await res[responseType]()
  } catch (e) {
    if (transformResponse && transformResponse.length > 1) {
      return transformResponse(undefined, e)
    } else {
      throw e
    }
  }

  const result: QResponse = {
    body,
    headers: headersProxy,
    ok: res.ok,
    redirected: res.redirected,
    status: res.status,
    statusText: res.statusText,
    url: res.url,
    type: res.type,
  }

  return transformResponse ? transformResponse(result) : result
}
