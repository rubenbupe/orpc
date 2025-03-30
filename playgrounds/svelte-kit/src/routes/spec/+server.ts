import { OpenAPIGenerator } from '@rubenbupe/orpc-openapi'
import { ZodToJsonSchemaConverter } from '@rubenbupe/orpc-zod'
import type { RequestHandler } from '@sveltejs/kit'
import { router } from '../../router'

const openAPIGenerator = new OpenAPIGenerator({
  schemaConverters: [
    new ZodToJsonSchemaConverter(),
  ],
})

export const GET: RequestHandler = async ({ request }) => {
  const spec = await openAPIGenerator.generate(router, {
    info: {
      title: 'ORPC Playground',
      version: '1.0.0',
    },
    servers: [{ url: '/api' /** Should use absolute URLs in production */ }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  })

  return new Response(JSON.stringify(spec), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
