import type { ClientContext } from '@rubenbupe/orpc-client'
import type { AnyContractRouter } from '@rubenbupe/orpc-contract'
import { LinkFetchClient, type LinkFetchClientOptions } from '@rubenbupe/orpc-client/fetch'
import { StandardLink } from '@rubenbupe/orpc-client/standard'
import { StandardBracketNotationSerializer, StandardOpenAPIJsonSerializer, StandardOpenapiLinkCodec, type StandardOpenAPILinkOptions, StandardOpenAPISerializer } from '../standard'

export interface OpenAPILinkOptions<T extends ClientContext>
  extends StandardOpenAPILinkOptions<T>, LinkFetchClientOptions<T> { }

export class OpenAPILink<T extends ClientContext> extends StandardLink<T> {
  constructor(contract: AnyContractRouter, options: OpenAPILinkOptions<T>) {
    const jsonSerializer = new StandardOpenAPIJsonSerializer(options)
    const bracketNotationSerializer = new StandardBracketNotationSerializer()
    const serializer = new StandardOpenAPISerializer(jsonSerializer, bracketNotationSerializer)
    const linkCodec = new StandardOpenapiLinkCodec(contract, serializer, options)
    const linkClient = new LinkFetchClient(options)

    super(linkCodec, linkClient, options)
  }
}
