---
title: Client-Side Clients
description: Call your oRPC procedures remotely as if they were local functions.
---

# Client-Side Clients

Call your [procedures](/docs/procedure) remotely as if they were local functions.

## Installation

::: code-group

```sh [npm]
npm install @rubenbupe/orpc-client@latest
```

```sh [yarn]
yarn add @rubenbupe/orpc-client@latest
```

```sh [pnpm]
pnpm add @rubenbupe/orpc-client@latest
```

```sh [bun]
bun add @rubenbupe/orpc-client@latest
```

```sh [deno]
deno install npm:@rubenbupe/orpc-client@latest
```

:::

## Creating a Client

This guide uses [RPCLink](/docs/client/rpc-link), so make sure your server is set up with [RPCHandler](/docs/rpc-handler).

```ts
import { createORPCClient } from '@rubenbupe/orpc-client'
import { RPCLink } from '@rubenbupe/orpc-client/fetch'
import { RouterClient } from '@rubenbupe/orpc-server'
import { ContractRouterClient } from '@rubenbupe/orpc-contract'

const link = new RPCLink({
  url: 'http://localhost:3000/rpc',
  headers: () => ({
    authorization: 'Bearer token',
  }),
  // fetch: <-- provide fetch polyfill fetch if needed
})

// Create a client for your router
const client: RouterClient<typeof router> = createORPCClient(link)
// Or, create a client using a contract
const client: ContractRouterClient<typeof contract> = createORPCClient(link)
```

:::tip
You can export `RouterClient<typeof router>` and `ContractRouterClient<typeof contract>` from server instead.
:::

## Calling Procedures

Once your client is set up, you can call your [procedures](/docs/procedure) as if they were local functions.

```ts twoslash
import { router } from './shared/planet'
import { RouterClient } from '@rubenbupe/orpc-server'

const client = {} as RouterClient<typeof router>
// ---cut---
const planet = await client.planet.find({ id: 1 })

client.planet.create
//            ^|
```
