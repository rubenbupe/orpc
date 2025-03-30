import type { router } from '@/router'
import type { RouterClient } from '@rubenbupe/orpc-server'
import { createORPCClient } from '@rubenbupe/orpc-client'
import { RPCLink } from '@rubenbupe/orpc-client/fetch'
import { createORPCReactQueryUtils } from '@rubenbupe/orpc-react-query'

const rpcLink = new RPCLink({
  url: new URL('/rpc', typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000'),
  headers: () => ({
    Authorization: 'Bearer default-token',
  }),
})

export const orpcClient: RouterClient<typeof router> = createORPCClient(rpcLink)

export const orpc = createORPCReactQueryUtils(orpcClient)
