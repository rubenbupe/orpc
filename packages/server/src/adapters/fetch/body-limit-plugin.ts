import type { Context } from '../../context'
import type { FetchHandlerOptions, FetchHandlerPlugin } from './handler'
import { ORPCError } from '@rubenbupe/orpc-client'

export interface BodyLimitPluginOptions {
  /**
   * The maximum size of the body in bytes.
   */
  maxBodySize: number
}

export class BodyLimitPlugin<T extends Context> implements FetchHandlerPlugin<T> {
  private readonly maxBodySize: number

  constructor(options: BodyLimitPluginOptions) {
    this.maxBodySize = options.maxBodySize
  }

  initRuntimeAdapter(options: FetchHandlerOptions<T>): void {
    options.adapterInterceptors ??= []

    options.adapterInterceptors.push(async (options) => {
      if (!options.request.body) {
        return options.next()
      }

      let currentBodySize = 0

      const rawReader = options.request.body.getReader()

      const reader = new ReadableStream({
        start: async (controller) => {
          try {
            if (Number(options.request.headers.get('content-length')) > this.maxBodySize) {
              controller.error(new ORPCError('PAYLOAD_TOO_LARGE'))
              return
            }

            while (true) {
              const { done, value } = await rawReader.read()

              if (done) {
                break
              }

              currentBodySize += value.length

              if (currentBodySize > this.maxBodySize) {
                controller.error(new ORPCError('PAYLOAD_TOO_LARGE'))
                break
              }

              controller.enqueue(value)
            }
          }
          finally {
            controller.close()
          }
        },
      })

      const requestInit: RequestInit & { duplex: 'half' } = { body: reader, duplex: 'half' }

      return options.next({
        ...options,
        request: new Request(options.request, requestInit),
      })
    })
  }
}
