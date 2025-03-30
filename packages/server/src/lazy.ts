import type { HTTPPath } from '@rubenbupe/orpc-client'

export const LAZY_SYMBOL: unique symbol = Symbol('ORPC_LAZY_SYMBOL')

export interface LazyMeta {
  prefix?: HTTPPath
}

export interface Lazy<T> {
  [LAZY_SYMBOL]: {
    loader: () => Promise<{ default: T }>
    meta: LazyMeta
  }
}

export type Lazyable<T> = T | Lazy<T>

export function lazy<T>(loader: () => Promise<{ default: T }>, meta: LazyMeta = {}): Lazy<T> {
  return {
    [LAZY_SYMBOL]: {
      loader,
      meta,
    },
  }
}

export function isLazy(item: unknown): item is Lazy<any> {
  return (
    (typeof item === 'object' || typeof item === 'function')
    && item !== null
    && LAZY_SYMBOL in item
  )
}

export function getLazyMeta(lazied: Lazy<any>): LazyMeta {
  return lazied[LAZY_SYMBOL].meta
}

export function unlazy<T extends Lazyable<any>>(lazied: T): Promise<{ default: T extends Lazy<infer U> ? U : T }> {
  return isLazy(lazied) ? lazied[LAZY_SYMBOL].loader() : Promise.resolve({ default: lazied })
}
