import { router } from '@/router'
import { OpenAPIHandler } from '@rubenbupe/orpc-openapi/next'
import { onError } from '@rubenbupe/orpc-server'
import { serve } from '@rubenbupe/orpc-server/next'
import { ZodSmartCoercionPlugin } from '@rubenbupe/orpc-zod'
import '../../../polyfill'

const openAPIHandler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
  plugins: [
    new ZodSmartCoercionPlugin(),
  ],
})

export const { GET, POST, PUT, PATCH, DELETE } = serve(openAPIHandler, {
  prefix: '/api',
  context: async (req) => {
    return {}
  },
})
