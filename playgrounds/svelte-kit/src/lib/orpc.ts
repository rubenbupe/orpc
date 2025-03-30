import type { RouterClient } from '@rubenbupe/orpc-server'
import type { router } from '../router'
import { createORPCClient } from '@rubenbupe/orpc-client'
import { RPCLink } from '@rubenbupe/orpc-client/fetch'
import { createORPCSvelteQueryUtils } from '@rubenbupe/orpc-svelte-query'

const rpcLink = new RPCLink({
  url: new URL('/rpc', typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000'),
  headers: () => ({
    Authorization: 'Bearer default-token',
  }),
})

export const client: RouterClient<typeof router> = createORPCClient(rpcLink)

export const orpc = createORPCSvelteQueryUtils(client)
