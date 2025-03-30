import type { AnyContractProcedure, ErrorMap } from '@rubenbupe/orpc-contract'
import type { OpenAPI } from './openapi'
import { isProcedure } from '@rubenbupe/orpc-server'

const OPERATION_EXTENDER_SYMBOL = Symbol('ORPC_OPERATION_EXTENDER')

export type OverrideOperationValue =
  | Partial<OpenAPI.OperationObject>
  | ((current: OpenAPI.OperationObject, procedure: AnyContractProcedure) => OpenAPI.OperationObject)

export function customOpenAPIOperation<T extends object>(o: T, extend: OverrideOperationValue): T {
  return new Proxy(o, {
    get(target, prop, receiver) {
      if (prop === OPERATION_EXTENDER_SYMBOL) {
        return extend
      }

      return Reflect.get(target, prop, receiver)
    },
  })
}

export function getCustomOpenAPIOperation(o: object): OverrideOperationValue | undefined {
  return (o as any)[OPERATION_EXTENDER_SYMBOL] as OverrideOperationValue | undefined
}

export function applyCustomOpenAPIOperation(operation: OpenAPI.OperationObject, contract: AnyContractProcedure): OpenAPI.OperationObject {
  const operationCustoms: OverrideOperationValue[] = []

  for (const errorItem of Object.values(contract['~orpc'].errorMap) as ErrorMap[keyof ErrorMap][]) {
    const maybeExtender = errorItem ? getCustomOpenAPIOperation(errorItem) : undefined

    if (maybeExtender) {
      operationCustoms.push(maybeExtender)
    }
  }

  if (isProcedure(contract)) {
    for (const middleware of contract['~orpc'].middlewares) {
      const maybeExtender = getCustomOpenAPIOperation(middleware)

      if (maybeExtender) {
        operationCustoms.push(maybeExtender)
      }
    }
  }

  let currentOperation = operation

  for (const custom of operationCustoms) {
    if (typeof custom === 'function') {
      currentOperation = custom(currentOperation, contract)
    }
    else {
      currentOperation = {
        ...currentOperation,
        ...custom,
      }
    }
  }

  return currentOperation
}
