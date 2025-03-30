import type { ORPCError } from '@rubenbupe/orpc-client'
import type { StandardRPCSerializer } from '@rubenbupe/orpc-client/standard'
import type { StandardBody, StandardLazyRequest, StandardResponse } from '@rubenbupe/orpc-standard-server'
import type { AnyProcedure } from '../../procedure'
import type { StandardCodec, StandardParams } from './types'
import { parseEmptyableJSON } from '@rubenbupe/orpc-shared'

export class StandardRPCCodec implements StandardCodec {
  constructor(
    private readonly serializer: StandardRPCSerializer,
  ) {
  }

  async decode(request: StandardLazyRequest, _params: StandardParams | undefined, _procedure: AnyProcedure): Promise<unknown> {
    const serialized = request.method === 'GET'
      ? parseEmptyableJSON(request.url.searchParams.getAll('data').at(-1)) // this prevent duplicate data params
      : await request.body() as any

    return this.serializer.deserialize(serialized)
  }

  encode(output: unknown, _procedure: AnyProcedure): StandardResponse {
    return {
      status: 200,
      headers: {},
      body: this.serializer.serialize(output) as StandardBody,
    }
  }

  encodeError(error: ORPCError<any, any>): StandardResponse {
    return {
      status: error.status,
      headers: {},
      body: this.serializer.serialize(error.toJSON()) as StandardBody,
    }
  }
}
