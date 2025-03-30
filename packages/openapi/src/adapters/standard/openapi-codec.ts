import type { ORPCError } from '@rubenbupe/orpc-client'
import type { StandardOpenAPISerializer } from '@rubenbupe/orpc-openapi-client/standard'
import type { AnyProcedure } from '@rubenbupe/orpc-server'
import type { StandardCodec, StandardParams } from '@rubenbupe/orpc-server/standard'
import type { StandardHeaders, StandardLazyRequest, StandardResponse } from '@rubenbupe/orpc-standard-server'
import { fallbackContractConfig } from '@rubenbupe/orpc-contract'
import { isObject } from '@rubenbupe/orpc-shared'

export class StandardOpenAPICodec implements StandardCodec {
  constructor(
    private readonly serializer: StandardOpenAPISerializer,
  ) {
  }

  async decode(request: StandardLazyRequest, params: StandardParams | undefined, procedure: AnyProcedure): Promise<unknown> {
    const inputStructure = fallbackContractConfig('defaultInputStructure', procedure['~orpc'].route.inputStructure)

    if (inputStructure === 'compact') {
      const data = request.method === 'GET'
        ? this.serializer.deserialize(request.url.searchParams)
        : this.serializer.deserialize(await request.body())

      if (data === undefined) {
        return params
      }

      if (isObject(data)) {
        return {
          ...params,
          ...data,
        }
      }

      return data
    }

    const deserializeSearchParams = () => {
      return this.serializer.deserialize(request.url.searchParams)
    }

    return {
      params,
      get query() {
        const value = deserializeSearchParams()
        Object.defineProperty(this, 'query', { value, writable: true })
        return value
      },
      set query(value) {
        Object.defineProperty(this, 'query', { value, writable: true })
      },
      headers: request.headers,
      body: this.serializer.deserialize(await request.body()),
    }
  }

  encode(output: unknown, procedure: AnyProcedure): StandardResponse {
    const successStatus = fallbackContractConfig('defaultSuccessStatus', procedure['~orpc'].route.successStatus)
    const outputStructure = fallbackContractConfig('defaultOutputStructure', procedure['~orpc'].route.outputStructure)

    if (outputStructure === 'compact') {
      return {
        status: successStatus,
        headers: {},
        body: this.serializer.serialize(output),
      }
    }

    if (!isObject(output)) {
      throw new Error(
        'Invalid output structure for "detailed" output. Expected format: { body: any, headers?: Record<string, string | string[] | undefined> }',
      )
    }

    return {
      status: successStatus,
      headers: output.headers as StandardHeaders ?? {},
      body: this.serializer.serialize(output.body),
    }
  }

  encodeError(error: ORPCError<any, any>): StandardResponse {
    return {
      status: error.status,
      headers: {},
      body: this.serializer.serialize(error.toJSON(), { outputFormat: 'plain' }),
    }
  }
}
