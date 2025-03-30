import type { Context, Router } from '@rubenbupe/orpc-server'
import type { NodeHttpHandlerOptions } from '@rubenbupe/orpc-server/node'
import type { StandardOpenAPIHandlerOptions } from '../standard'
import { StandardBracketNotationSerializer, StandardOpenAPIJsonSerializer, StandardOpenAPISerializer } from '@rubenbupe/orpc-openapi-client/standard'
import { NodeHttpHandler } from '@rubenbupe/orpc-server/node'
import { StandardHandler } from '@rubenbupe/orpc-server/standard'
import { StandardOpenAPICodec, StandardOpenAPIMatcher } from '../standard'

export class OpenAPIHandler<T extends Context> extends NodeHttpHandler<T> {
  constructor(router: Router<any, T>, options: NoInfer<StandardOpenAPIHandlerOptions<T> & NodeHttpHandlerOptions<T>> = {}) {
    const jsonSerializer = new StandardOpenAPIJsonSerializer(options)
    const bracketNotationSerializer = new StandardBracketNotationSerializer()
    const serializer = new StandardOpenAPISerializer(jsonSerializer, bracketNotationSerializer)
    const matcher = new StandardOpenAPIMatcher()
    const codec = new StandardOpenAPICodec(serializer)

    super(new StandardHandler(router, matcher, codec, options), options)
  }
}
