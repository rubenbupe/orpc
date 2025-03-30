import type { AnySchema } from '@rubenbupe/orpc-contract'
import type { ConditionalSchemaConverter, JSONSchema, SchemaConvertOptions } from '@rubenbupe/orpc-openapi'
import type { Type } from 'arktype'

export class experimental_ArkTypeToJsonSchemaConverter implements ConditionalSchemaConverter {
  condition(schema: AnySchema | undefined): boolean {
    return schema !== undefined && schema['~standard'].vendor === 'arktype'
  }

  convert(schema: AnySchema | undefined, _options: SchemaConvertOptions): [required: boolean, jsonSchema: Exclude<JSONSchema, boolean>] {
    const jsonSchema = (schema as Type).toJsonSchema()

    return [true, jsonSchema]
  }
}
