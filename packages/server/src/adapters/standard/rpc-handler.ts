import type { StandardRPCJsonSerializerOptions } from '@rubenbupe/orpc-client/standard'
import type { Context } from '../../context'
import type { StandardHandlerOptions } from './handler'

export interface StandardRPCHandlerOptions<T extends Context> extends StandardHandlerOptions<T>, StandardRPCJsonSerializerOptions {}
