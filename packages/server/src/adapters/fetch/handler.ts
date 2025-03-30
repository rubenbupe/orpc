import type { Context } from '../../context'
import type { StandardHandleOptions, StandardHandler, StandardHandlerPlugin } from '../standard'
import type { FriendlyStandardHandleOptions } from '../standard/utils'
import { intercept, type Interceptor, type MaybeOptionalOptions, resolveMaybeOptionalOptions, toArray } from '@rubenbupe/orpc-shared'
import { toFetchResponse, type ToFetchResponseOptions, toStandardLazyRequest } from '@rubenbupe/orpc-standard-server-fetch'
import { resolveFriendlyStandardHandleOptions } from '../standard/utils'

export type FetchHandleResult = { matched: true, response: Response } | { matched: false, response: undefined }

export interface FetchHandlerPlugin<T extends Context> extends StandardHandlerPlugin<T> {
  initRuntimeAdapter?(options: FetchHandlerOptions<T>): void
}

export interface FetchHandlerInterceptorOptions<T extends Context> extends StandardHandleOptions<T> {
  request: Request
  toFetchResponseOptions: ToFetchResponseOptions
}

export interface FetchHandlerOptions<T extends Context> extends ToFetchResponseOptions {
  adapterInterceptors?: Interceptor<FetchHandlerInterceptorOptions<T>, FetchHandleResult, unknown >[]

  plugins?: FetchHandlerPlugin<T>[]
}

export class FetchHandler<T extends Context> {
  private readonly toFetchResponseOptions: ToFetchResponseOptions
  private readonly adapterInterceptors: Exclude<FetchHandlerOptions<T>['adapterInterceptors'], undefined>

  constructor(
    private readonly standardHandler: StandardHandler<T>,
    options: NoInfer<FetchHandlerOptions<T>> = {},
  ) {
    for (const plugin of toArray(options.plugins)) {
      plugin.initRuntimeAdapter?.(options)
    }

    this.adapterInterceptors = toArray(options.adapterInterceptors)
    this.toFetchResponseOptions = options
  }

  async handle(
    request: Request,
    ...rest: MaybeOptionalOptions<FriendlyStandardHandleOptions<T>>
  ): Promise<FetchHandleResult> {
    return intercept(
      this.adapterInterceptors,
      {
        ...resolveFriendlyStandardHandleOptions(resolveMaybeOptionalOptions(rest)),
        request,
        toFetchResponseOptions: this.toFetchResponseOptions,
      },
      async ({ request, toFetchResponseOptions, ...options }) => {
        const standardRequest = toStandardLazyRequest(request)

        const result = await this.standardHandler.handle(standardRequest, options)

        if (!result.matched) {
          return result
        }

        return {
          matched: true,
          response: toFetchResponse(result.response, toFetchResponseOptions),
        }
      },
    )
  }
}
