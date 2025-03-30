import type { HTTPPath } from '@rubenbupe/orpc-client'
import type { AnySchema, ErrorFromErrorMap, InferSchemaOutput, Meta } from '@rubenbupe/orpc-contract'
import type { Interceptor } from '@rubenbupe/orpc-shared'
import type { StandardLazyRequest, StandardResponse } from '@rubenbupe/orpc-standard-server'
import type { Context } from '../../context'
import type { ProcedureClientInterceptorOptions } from '../../procedure-client'
import type { Router } from '../../router'
import type { StandardCodec, StandardMatcher } from './types'
import { ORPCError, toORPCError } from '@rubenbupe/orpc-client'
import { intercept, toArray } from '@rubenbupe/orpc-shared'
import { createProcedureClient } from '../../procedure-client'

export interface StandardHandleOptions<T extends Context> {
  prefix?: HTTPPath
  context: T
}

export type StandardHandleResult = { matched: true, response: StandardResponse } | { matched: false, response: undefined }

export interface StandardHandlerPlugin<TContext extends Context> {
  init?(options: StandardHandlerOptions<TContext>): void
}

export interface StandardHandlerInterceptorOptions<T extends Context> extends StandardHandleOptions<T> {
  request: StandardLazyRequest
}

export interface StandardHandlerOptions<TContext extends Context> {
  plugins?: StandardHandlerPlugin<TContext>[]

  /**
   * Interceptors at the request level, helpful when you want catch errors
   */
  interceptors?: Interceptor<StandardHandlerInterceptorOptions<TContext>, StandardHandleResult, unknown>[]

  /**
   * Interceptors at the root level, helpful when you want override the request/response
   */
  rootInterceptors?: Interceptor<StandardHandlerInterceptorOptions<TContext>, StandardHandleResult, unknown>[]

  /**
   *
   * Interceptors for procedure client.
   */
  clientInterceptors?: Interceptor<
    ProcedureClientInterceptorOptions<TContext, Record<never, never>, Meta>,
    InferSchemaOutput<AnySchema>,
    ErrorFromErrorMap<Record<never, never>>
  >[]
}

export class StandardHandler<T extends Context> {
  private readonly interceptors: Exclude<StandardHandlerOptions<T>['interceptors'], undefined>
  private readonly clientInterceptors: Exclude<StandardHandlerOptions<T>['clientInterceptors'], undefined>
  private readonly rootInterceptors: Exclude<StandardHandlerOptions<T>['rootInterceptors'], undefined>

  constructor(
    router: Router<any, T>,
    private readonly matcher: StandardMatcher,
    private readonly codec: StandardCodec,
    options: NoInfer<StandardHandlerOptions<T>>,
  ) {
    for (const plugin of toArray(options.plugins)) {
      plugin.init?.(options)
    }

    this.interceptors = toArray(options.interceptors)
    this.clientInterceptors = toArray(options.clientInterceptors)
    this.rootInterceptors = toArray(options.rootInterceptors)

    this.matcher.init(router)
  }

  handle(request: StandardLazyRequest, options: StandardHandleOptions<T>): Promise<StandardHandleResult> {
    return intercept(
      this.rootInterceptors,
      { ...options, request },
      async (interceptorOptions) => {
        let isDecoding = false

        try {
          return await intercept(
            this.interceptors,
            interceptorOptions,
            async ({ request, context, prefix }) => {
              const method = request.method
              const url = request.url

              if (prefix && !url.pathname.startsWith(prefix)) {
                return { matched: false, response: undefined }
              }

              const pathname = prefix
                ? url.pathname.replace(prefix, '')
                : url.pathname

              const match = await this.matcher.match(method, `/${pathname.replace(/^\/|\/$/g, '')}`)

              if (!match) {
                return { matched: false, response: undefined }
              }

              const client = createProcedureClient(match.procedure, {
                context,
                path: match.path,
                interceptors: this.clientInterceptors,
              })

              isDecoding = true
              const input = await this.codec.decode(request, match.params, match.procedure)
              isDecoding = false

              const lastEventId = Array.isArray(request.headers['last-event-id'])
                ? request.headers['last-event-id'].at(-1)
                : request.headers['last-event-id']

              const output = await client(input, { signal: request.signal, lastEventId })

              const response = this.codec.encode(output, match.procedure)

              return {
                matched: true,
                response,
              }
            },
          )
        }
        catch (e) {
          const error = isDecoding && !(e instanceof ORPCError)
            ? new ORPCError('BAD_REQUEST', {
              message: `Malformed request. Ensure the request body is properly formatted and the 'Content-Type' header is set correctly.`,
              cause: e,
            })
            : toORPCError(e)

          const response = this.codec.encodeError(error)

          return {
            matched: true,
            response,
          }
        }
      },
    )
  }
}
