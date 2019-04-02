import { Deep } from './Deep'

export type FormDataValue = string | number | boolean | undefined | null | Blob
export interface FormDataInit {
  [key: string]: Deep<FormDataValue | FormDataInit>
}

export default (body?: FormDataInit | FormData | null) => {
  if (body instanceof FormData) return body

  const formData = new FormData()
  if (body) {
    Object.keys(body).forEach(name => {
      append.call(formData, name, body[name])
    })
  }
  return formData
}

function append(
  this: FormData,
  name: string,
  value: Deep<FormDataValue | FormDataInit>,
) {
  if (value === null || value === undefined) return

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    this.append(name, value + '')
  } else if (value instanceof Blob) {
    this.append(name, value)
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
