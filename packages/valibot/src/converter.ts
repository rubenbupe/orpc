import type { AnySchema } from '@rubenbupe/orpc-contract'
import type { ConditionalSchemaConverter, JSONSchema, SchemaConvertOptions } from '@rubenbupe/orpc-openapi'
import { type ConversionConfig, toJsonSchema } from '@valibot/to-json-schema'

export interface experimental_ValibotToJsonSchemaConverterOptions extends Pick<ConversionConfig, 'errorMode'> {

}

export class experimental_ValibotToJsonSchemaConverter implements ConditionalSchemaConverter {
  private readonly errorMode: experimental_ValibotToJsonSchemaConverterOptions['errorMode']

  constructor(options: experimental_ValibotToJsonSchemaConverterOptions = {}) {
    this.errorMode = options.errorMode ?? 'ignore'
  }

  condition(schema: AnySchema | undefined): boolean {
    return schema !== undefined && schema['~standard'].vendor === 'valibot'
  }

  convert(schema: AnySchema | undefined, _options: SchemaConvertOptions): [required: boolean, jsonSchema: Exclude<JSONSchema, boolean>] {
    const jsonSchema = toJsonSchema(schema as any, { errorMode: this.errorMode })

    return [true, jsonSchema as any]
  }
}
