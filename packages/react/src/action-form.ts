import type { AnySchema } from '@rubenbupe/orpc-contract'
import type { Context, CreateProcedureClientOptions, ErrorMap, Lazyable, Meta, Procedure } from '@rubenbupe/orpc-server'
import type { Interceptor, MaybeOptionalOptions } from '@rubenbupe/orpc-shared'
import { ORPCError } from '@rubenbupe/orpc-client'
import { StandardBracketNotationSerializer } from '@rubenbupe/orpc-openapi-client/standard'
import { createProcedureClient } from '@rubenbupe/orpc-server'
import { onError, resolveMaybeOptionalOptions, toArray } from '@rubenbupe/orpc-shared'

export interface FormAction {
  (form: FormData): Promise<void>
}

export const orpcErrorToNextHttpFallbackInterceptor: Interceptor<any, any, any> = onError((error) => {
  if (error instanceof ORPCError && [401, 403, 404].includes(error.status)) {
    const nextError = ORPCError.fromJSON(error.toJSON()) as any

    nextError.cause = error
    nextError.digest = `NEXT_HTTP_ERROR_FALLBACK;${error.status}`

    throw nextError
  }
})

export function createFormAction<
  TInitialContext extends Context,
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
  TErrorMap extends ErrorMap,
  TMeta extends Meta,
>(
  lazyableProcedure: Lazyable<Procedure<TInitialContext, any, TInputSchema, TOutputSchema, TErrorMap, TMeta>>,
  ...rest: MaybeOptionalOptions<
    CreateProcedureClientOptions<
      TInitialContext,
      TOutputSchema,
      TErrorMap,
      TMeta,
      Record<never, never>
    >
  >
): FormAction {
  const options = resolveMaybeOptionalOptions(rest)

  const client = createProcedureClient(lazyableProcedure, {
    ...options,
    interceptors: [orpcErrorToNextHttpFallbackInterceptor, ...toArray(options.interceptors)],
  })

  const bracketNotation = new StandardBracketNotationSerializer()

  return async (form) => {
    const input = bracketNotation.deserialize([...form])
    await client(input as any)
  }
}
