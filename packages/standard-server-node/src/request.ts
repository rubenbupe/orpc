import type { StandardLazyRequest } from '@rubenbupe/orpc-standard-server'
import type { NodeHttpRequest, NodeHttpResponse } from './types'
import { once } from '@rubenbupe/orpc-shared'
import { toStandardBody } from './body'
import { toAbortSignal } from './signal'

export function toStandardLazyRequest(
  req: NodeHttpRequest,
  res: NodeHttpResponse,
): StandardLazyRequest {
  const method = req.method ?? 'GET'

  const protocol = ('encrypted' in req.socket && req.socket.encrypted ? 'https:' : 'http:')
  const host = req.headers.host ?? 'localhost'
  const url = new URL(req.originalUrl ?? req.url ?? '/', `${protocol}//${host}`)

  return {
    method,
    url,
    headers: req.headers,
    body: once(() => toStandardBody(req)),
    signal: toAbortSignal(res),
  }
}
