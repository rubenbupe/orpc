---
title: OpenAPILink
description: Details on using OpenAPILink in oRPC clients.
---

# OpenAPILink

OpenAPILink enables communication with an [OpenAPIHandler](/docs/openapi/openapi-handler) on your server using HTTP/Fetch.

## Installation

::: code-group

```sh [npm]
npm install @rubenbupe/orpc-openapi-client@latest
```

```sh [yarn]
yarn add @rubenbupe/orpc-openapi-client@latest
```

```sh [pnpm]
pnpm add @rubenbupe/orpc-openapi-client@latest
```

```sh [bun]
bun add @rubenbupe/orpc-openapi-client@latest
```

```sh [deno]
deno install npm:@rubenbupe/orpc-openapi-client@latest
```

:::

## Setup

To use `OpenAPILink`, you must have a [contract router](/docs/contract-first/define-contract#contract-router) and a server configured with an [OpenAPIHandler](/docs/openapi/openapi-handler).

::: info
A normal [router](/docs/router) works as a contract router as long as it does not include a [lazy router](/docs/router#lazy-router). You can also unlazy a router using the [unlazyRouter](/docs/advanced/mocking#using-the-implementer) utility.
:::

```ts twoslash
import { contract } from './shared/planet'
// ---cut---
import type { JsonifiedClient } from '@rubenbupe/orpc-openapi-client'
import type { ContractRouterClient } from '@rubenbupe/orpc-contract'
import { createORPCClient } from '@rubenbupe/orpc-client'
import { OpenAPILink } from '@rubenbupe/orpc-openapi-client/fetch'

const link = new OpenAPILink(contract, {
  url: 'http://localhost:3000/api',
  headers: () => ({
    'x-api-key': 'my-api-key',
  }),
  // fetch: <-- polyfill fetch if needed
})

const client: JsonifiedClient<ContractRouterClient<typeof contract>> = createORPCClient(link)
```

:::warning
Wrap your client with `JsonifiedClient` to ensure it accurately reflects the server responses.
:::

## Limitations

Unlike [RPCLink](/docs/client/rpc-link), `OpenAPILink` has some constraints:

- Payloads containing a `Blob` or `File` (outside the root level) must use `multipart/form-data` and serialized using [Bracket Notation](/docs/openapi/bracket-notation).
- For `GET` requests, the payload must be sent as `URLSearchParams` and serialized using [Bracket Notation](/docs/openapi/bracket-notation).

:::warning
In these cases, both the request and response are subject to the limitations of [Bracket Notation Limitations](/docs/openapi/bracket-notation#limitations). Additionally, oRPC converts data to strings (exclude `null` and `undefined` will not be represented).
:::

## CORS policy

`OpenAPILink` requires access to the `Content-Disposition` to distinguish file responses from other responses whe file has a common MIME type like `application/json`, `plain/text`, etc. To enable this, include `Content-Disposition` in your CORS policy's `Access-Control-Expose-Headers`:

```ts
const handler = new OpenAPIHandler(router, {
  plugins: [
    new CORSPlugin({
      exposeHeaders: ['Content-Disposition'],
    }),
  ],
})
```

## Using Client Context

Client context lets you pass extra information when calling procedures and dynamically modify OpenAPILink's behavior.

```ts twoslash
import { contract } from './shared/planet'
// ---cut---
import type { JsonifiedClient } from '@rubenbupe/orpc-openapi-client'
import type { ContractRouterClient } from '@rubenbupe/orpc-contract'
import { createORPCClient } from '@rubenbupe/orpc-client'
import { OpenAPILink } from '@rubenbupe/orpc-openapi-client/fetch'

interface ClientContext {
  something?: string
}

const link = new OpenAPILink<ClientContext>(contract, {
  url: 'http://localhost:3000/api',
  headers: async ({ context }) => ({
    'x-api-key': context?.something ?? ''
  })
})

const client: JsonifiedClient<ContractRouterClient<typeof contract, ClientContext>> = createORPCClient(link)

const result = await client.planet.list(
  { limit: 10 },
  { context: { something: 'value' } }
)
```

:::info
If a property in `ClientContext` is required, oRPC enforces its inclusion when calling procedures.
:::

## SSE Like Behavior

Unlike traditional SSE, the [Event Iterator](/docs/event-iterator) does not automatically retry on error. To enable automatic retries, refer to the [Client Retry Plugin](/docs/plugins/client-retry).

## Event Iterator Keep Alive

:::warning
These options for sending [Event Iterator](/docs/event-iterator) from **client to the server**, not from **the server to client** as used in [RPCHandler Event Iterator Keep Alive](/docs/rpc-handler#event-iterator-keep-alive) or [OpenAPIHandler Event Iterator Keep Alive](/docs/openapi/openapi-handler#event-iterator-keep-alive).

**In 99% of cases, you don't need to configure these options.**
:::

To keep [Event Iterator](/docs/event-iterator) connections alive, `OpenAPILink` periodically sends a ping comment to the server. You can configure this behavior using the following options:

- `eventIteratorKeepAliveEnabled` (default: `true`) – Enables or disables pings.
- `eventIteratorKeepAliveInterval` (default: `5000`) – Time between pings (in milliseconds).
- `eventIteratorKeepAliveComment` (default: `''`) – Custom content for ping messages.

```ts
const link = new OpenAPILink({
  eventIteratorKeepAliveEnabled: true,
  eventIteratorKeepAliveInterval: 5000, // 5 seconds
  eventIteratorKeepAliveComment: '',
})
```
