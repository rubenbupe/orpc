import type { QueryKey } from '@tanstack/vue-query'
import type { BuildKeyOptions, KeyType } from './key'
import { buildKey } from './key'

export interface GeneralUtils<TInput> {
  key<UType extends KeyType = undefined>(options?: BuildKeyOptions<UType, TInput>): QueryKey
}

export function createGeneralUtils<TInput>(
  path: string[],
): GeneralUtils<TInput> {
  return {
    key(options) {
      return buildKey(path, options)
    },
  }
}
