import type { StandardLazyRequest, StandardRequest } from '@rubenbupe/orpc-standard-server'
import type { ToFetchBodyOptions } from './body'
import { once } from '@rubenbupe/orpc-shared'
import { toFetchBody, toStandardBody } from './body'
import { toFetchHeaders, toStandardHeaders } from './headers'

export function toStandardLazyRequest(request: Request): StandardLazyRequest {
  return {
    url: new URL(request.url),
    signal: request.signal,
    method: request.method,
    body: once(() => toStandardBody(request)),
    get headers() {
      const headers = toStandardHeaders(request.headers)
      Object.defineProperty(this, 'headers', { value: headers, writable: true })
      return headers
    },
    set headers(value) {
      Object.defineProperty(this, 'headers', { value, writable: true })
    },
  }
}

export interface ToFetchRequestOptions extends ToFetchBodyOptions {}

export function toFetchRequest(request: StandardRequest, options: ToFetchRequestOptions = {}): Request {
  const headers = toFetchHeaders(request.headers)
  const body = toFetchBody(request.body, headers, options)

  return new Request(request.url, {
    signal: request.signal,
    method: request.method,
    headers,
    body,
  })
}
