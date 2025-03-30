import type { HTTPMethod, HTTPPath } from '@rubenbupe/orpc-client'
import type { OpenAPI } from './openapi'
import type { FileSchema, JSONSchema, ObjectSchema } from './schema'
import { standardizeHTTPPath } from '@rubenbupe/orpc-openapi-client/standard'
import { findDeepMatches, isObject } from '@rubenbupe/orpc-shared'
import { filterSchemaBranches, isFileSchema } from './schema-utils'

/**
 * @internal
 */
export function toOpenAPIPath(path: HTTPPath): string {
  return standardizeHTTPPath(path).replace(/\/\{\+([^}]+)\}/g, '/{$1}')
}

/**
 * @internal
 */
export function toOpenAPIMethod(method: HTTPMethod): Lowercase<HTTPMethod> {
  return method.toLocaleLowerCase() as Lowercase<HTTPMethod>
}

/**
 * @internal
 */
export function toOpenAPIContent(schema: JSONSchema): Record<string, OpenAPI.MediaTypeObject> {
  const content: Record<string, OpenAPI.MediaTypeObject> = {}

  const [matches, restSchema] = filterSchemaBranches(schema, isFileSchema)

  for (const file of matches as FileSchema[]) {
    content[file.contentMediaType] = {
      schema: toOpenAPISchema(file),
    }
  }

  if (restSchema !== undefined) {
    content['application/json'] = {
      schema: toOpenAPISchema(restSchema),
    }

    const isStillHasFileSchema = findDeepMatches(v => isObject(v) && isFileSchema(v), restSchema).values.length > 0

    if (isStillHasFileSchema) {
      content['multipart/form-data'] = {
        schema: toOpenAPISchema(restSchema),
      }
    }
  }

  return content
}

/**
 * @internal
 */
export function toOpenAPIEventIteratorContent(
  [yieldsRequired, yieldsSchema]: [boolean, JSONSchema],
  [returnsRequired, returnsSchema]: [boolean, JSONSchema],
): Record<string, OpenAPI.MediaTypeObject> {
  return {
    'text/event-stream': {
      schema: toOpenAPISchema({
        oneOf: [
          {
            type: 'object',
            properties: {
              event: { const: 'message' },
              data: yieldsSchema,
              id: { type: 'string' },
              retry: { type: 'number' },
            },
            required: yieldsRequired ? ['event', 'data'] : ['event'],
          },
          {
            type: 'object',
            properties: {
              event: { const: 'done' },
              data: returnsSchema,
              id: { type: 'string' },
              retry: { type: 'number' },
            },
            required: returnsRequired ? ['event', 'data'] : ['event'],
          },
          {
            type: 'object',
            properties: {
              event: { const: 'error' },
              data: {},
              id: { type: 'string' },
              retry: { type: 'number' },
            },
            required: ['event'],
          },
        ],
      }),
    },
  }
}

/**
 * @internal
 */
export function toOpenAPIParameters(schema: ObjectSchema, parameterIn: 'path' | 'query' | 'header' | 'cookie'): OpenAPI.ParameterObject[] {
  const parameters: OpenAPI.ParameterObject[] = []

  for (const key in schema.properties) {
    const keySchema = schema.properties[key]!

    parameters.push({
      name: key,
      in: parameterIn,
      required: schema.required?.includes(key),
      style: parameterIn === 'query' ? 'deepObject' : undefined,
      explode: parameterIn === 'query' ? true : undefined,
      schema: toOpenAPISchema(keySchema) as any,
    })
  }

  return parameters
}

/**
 * @internal
 */
export function checkParamsSchema(schema: ObjectSchema, params: string[]): boolean {
  const properties = Object.keys(schema.properties ?? {})
  const required = schema.required ?? []

  if (properties.length !== params.length || properties.some(v => !params.includes(v))) {
    return false
  }

  if (required.length !== params.length || required.some(v => !params.includes(v))) {
    return false
  }

  return true
}

/**
 * @internal
 */
export function toOpenAPISchema(schema: JSONSchema): OpenAPI.SchemaObject & object {
  return schema === true
    ? {}
    : schema === false
      ? { not: {} }
      : schema as OpenAPI.SchemaObject
}
