import { eventIterator, oc } from '@rubenbupe/orpc-contract'
import { z } from 'zod'

export const sse = oc
  .route({
    method: 'GET',
    path: '/sse',
    tags: ['SSE'],
    summary: 'Server-Sent Events',
  })
  .output(eventIterator(z.object({ time: z.date() })))
