import { Deep } from './Deep'

export type ParamsValue = string | number | boolean | undefined | null
export interface ParamsInit {
  [key: string]: Deep<ParamsValue | ParamsInit>
}

export default (body?: ParamsInit | URLSearchParams | null) => {
  if (body instanceof URLSearchParams) return body

  const params = new URLSearchParams()
  if (body) {
    Object.keys(body).forEach(name => {
      append.call(params, name, body[name])
    })
  }
  return params
}

function append(
  this: URLSearchParams,
  name: string,
  value: Deep<ParamsValue | ParamsInit>,
) {
  if (value === null || value === undefined) return

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    this.append(name, value + '')
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => {
      append.call(this, `${name}[${i}]`, v)
    })
  } else {
    Object.keys(value).forEach(n => {
      append.call(this, `${name}[${n}]`, value[n])
    })
  }
}
