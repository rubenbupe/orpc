import type { StandardLazyResponse, StandardRequest } from '@rubenbupe/orpc-standard-server'
import type { ToFetchRequestOptions } from '@rubenbupe/orpc-standard-server-fetch'
import type { ClientContext, ClientOptions } from '../../types'
import type { StandardLinkClient } from '../standard'
import { toFetchRequest, toStandardLazyResponse } from '@rubenbupe/orpc-standard-server-fetch'

export interface LinkFetchClientOptions<T extends ClientContext> extends ToFetchRequestOptions {
  fetch?: (
    request: Request,
    init: { redirect?: Request['redirect'] },
    options: ClientOptions<T>,
    path: readonly string[],
    input: unknown
  ) => Promise<Response>
}

export class LinkFetchClient<T extends ClientContext> implements StandardLinkClient<T> {
  private readonly fetch: Exclude<LinkFetchClientOptions<T>['fetch'], undefined>
  private readonly toFetchRequestOptions: ToFetchRequestOptions

  constructor(options: LinkFetchClientOptions<T>) {
    this.fetch = options?.fetch ?? globalThis.fetch.bind(globalThis)
    this.toFetchRequestOptions = options
  }

  async call(request: StandardRequest, options: ClientOptions<T>, path: readonly string[], input: unknown): Promise<StandardLazyResponse> {
    const fetchRequest = toFetchRequest(request, this.toFetchRequestOptions)

    const fetchResponse = await this.fetch(fetchRequest, { redirect: 'manual' }, options, path, input)

    const lazyResponse = toStandardLazyResponse(fetchResponse)

    return lazyResponse
  }
}
