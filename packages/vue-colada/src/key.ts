import type { EntryKey } from '@pinia/colada'
import { StandardRPCJsonSerializer } from '@rubenbupe/orpc-client/standard'
import { stringifyJSON } from '@rubenbupe/orpc-shared'

export interface BuildKeyOptions<TInput> {
  input?: TInput
}

export function buildKey<TInput>(
  path: string[],
  options?: BuildKeyOptions<TInput>,
): EntryKey {
  if (options?.input === undefined) {
    return path
  }

  const [json, meta] = new StandardRPCJsonSerializer().serialize(options.input)

  return [
    ...path,
    { input: stringifyJSON({ json, meta }) },
  ]
}
