import type { Context } from '../../context'
import type { NodeHttpHandlerOptions, NodeHttpHandlerPlugin } from './handler'
import { ORPCError } from '@rubenbupe/orpc-client'

export interface BodyLimitPluginOptions {
  /**
   * The maximum size of the body in bytes.
   */
  maxBodySize: number
}

export class BodyLimitPlugin<T extends Context> implements NodeHttpHandlerPlugin<T> {
  private readonly maxBodySize: number

  constructor(options: BodyLimitPluginOptions) {
    this.maxBodySize = options.maxBodySize
  }

  initRuntimeAdapter(options: NodeHttpHandlerOptions<T>): void {
    options.adapterInterceptors ??= []

    options.adapterInterceptors.push(async (options) => {
      let isHeaderChecked = false

      const checkHeader = () => {
        if (!isHeaderChecked && Number(options.request.headers['content-length']) > this.maxBodySize) {
          throw new ORPCError('PAYLOAD_TOO_LARGE')
        }

        isHeaderChecked = true
      }

      const originalEmit = options.request.emit.bind(options.request)

      let currentBodySize = 0

      options.request.emit = (event: string, ...args: any[]) => {
        if (event === 'data') {
          checkHeader()

          currentBodySize += args[0].length

          if (currentBodySize > this.maxBodySize) {
            throw new ORPCError('PAYLOAD_TOO_LARGE')
          }
        }

        return originalEmit(event, ...args)
      }

      return options.next()
    })
  }
}
