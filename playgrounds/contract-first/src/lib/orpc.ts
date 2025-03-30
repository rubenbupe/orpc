import { createORPCClient } from '@rubenbupe/orpc-client'
import { RPCLink } from '@rubenbupe/orpc-client/fetch'
import { createORPCReactQueryUtils } from '@rubenbupe/orpc-react-query'
import type { ContractRouterClient } from '@rubenbupe/orpc-contract'
import type { contract } from '../contract'

const rpcLink = new RPCLink({
  url: new URL('/rpc', 'http://localhost:3000'),
  headers: () => ({
    Authorization: 'Bearer default-token',
  }),
})

export const orpcClient: ContractRouterClient<typeof contract> = createORPCClient(rpcLink)

export const orpc = createORPCReactQueryUtils(orpcClient)
