import type { StandardOpenAPIJsonSerializerOptions } from '@rubenbupe/orpc-openapi-client/standard'
import type { Context } from '@rubenbupe/orpc-server'
import type { StandardHandlerOptions } from '@rubenbupe/orpc-server/standard'

export interface StandardOpenAPIHandlerOptions<T extends Context> extends StandardHandlerOptions<T>, StandardOpenAPIJsonSerializerOptions {}
