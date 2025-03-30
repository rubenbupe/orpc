---
title: Server Action
description: Integrate oRPC procedures with React Server Actions
---

# Server Action

React [Server Actions](https://react.dev/reference/rsc/server-functions) let client components invoke asynchronous server functions. With oRPC, you simply append the `.actionable` modifier to enable Server Action compatibility.

## Server Side

Define your procedure with `.actionable` for Server Action support.

```ts twoslash
import { onError, os } from '@rubenbupe/orpc-server'
import { z } from 'zod'
// ---cut---
'use server'

export const ping = os
  .input(z.object({ name: z.string() }))
  .handler(async ({ input }) => `Hello, ${input.name}`)
  .actionable({
    context: async () => ({}), // Optional: provide initial context if needed
    interceptors: [
      onError(error => console.error(error)),
    ],
  })
```

:::tip
We recommend using [Runtime Context](/docs/context#execution-context) instead of [Initial Context](/docs/context#initial-context) when working with Server Actions.
:::

## Client Side

On the client, import and call your procedure as follows:

```tsx
'use client'

import { ping } from './actions'

export function MyComponent() {
  const [name, setName] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const [error, data] = await ping({ name })
    console.log(error, data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  )
}
```

This approach seamlessly integrates server-side procedures with client components via Server Actions.

## Type‑Safe Error Handling

The `.actionable` modifier supports type-safe error handling with a JSON-like error object.

```ts twoslash
import { os } from '@rubenbupe/orpc-server'
import { z } from 'zod'

export const someAction = os
  .input(z.object({ name: z.string() }))
  .errors({
    SOME_ERROR: {
      message: 'Some error message',
      data: z.object({ some: z.string() }),
    },
  })
  .handler(async ({ input }) => `Hello, ${input.name}`)
  .actionable()
// ---cut---
'use client'

const [error, data] = await someAction({ name: 'John' })

if (error) {
  if (error.defined) {
    console.log(error.data)
    //                 ^ Typed error data
  }
  // Handle unknown errors
}
else {
  // Handle success
  console.log(data)
}
```

## `@rubenbupe/orpc-react` Package

The `@rubenbupe/orpc-react` package offers utilities to integrate oRPC with React and React Server Actions.

### Installation

::: code-group

```sh [npm]
npm install @rubenbupe/orpc-react@latest
```

```sh [yarn]
yarn add @rubenbupe/orpc-react@latest
```

```sh [pnpm]
pnpm add @rubenbupe/orpc-react@latest
```

```sh [bun]
bun add @rubenbupe/orpc-react@latest
```

```sh [deno]
deno install npm:@rubenbupe/orpc-react@latest
```

:::

### `useServerAction` Hook

The `useServerAction` hook simplifies invoking server actions in React.

```tsx twoslash
import * as React from 'react'
import { os } from '@rubenbupe/orpc-server'
import { z } from 'zod'

export const someAction = os
  .input(z.object({ name: z.string() }))
  .errors({
    SOME_ERROR: {
      message: 'Some error message',
      data: z.object({ some: z.string() }),
    },
  })
  .handler(async ({ input }) => `Hello, ${input.name}`)
  .actionable()
// ---cut---
'use client'

import { useServerAction } from '@rubenbupe/orpc-react/hooks'
import { isDefinedError, onError } from '@rubenbupe/orpc-client'

export function MyComponent() {
  const { execute, data, error, status } = useServerAction(someAction, {
    interceptors: [
      onError((error) => {
        if (isDefinedError(error)) {
          console.error(error.data)
          //                   ^ Typed error data
        }
      }),
    ],
  })

  const action = async (form: FormData) => {
    const name = form.get('name') as string
    execute({ name })
  }

  return (
    <form action={action}>
      <input type="text" name="name" required />
      <button type="submit">Submit</button>
      {status === 'pending' && <p>Loading...</p>}
    </form>
  )
}
```

### `createFormAction` Utility

The `createFormAction` utility accepts a [procedure](/docs/procedure) and returns a function to handle form submissions. It uses [Bracket Notation](/docs/openapi/bracket-notation) to deserialize form data.

```tsx
import { createFormAction } from '@rubenbupe/orpc-react'

const dosomething = os
  .input(
    z.object({
      user: z.object({
        name: z.string(),
        age: z.coerce.number(),
      }),
    })
  )
  .handler(({ input }) => {
    console.log('Form action called!')
    console.log(input)
  })

export const redirectSomeWhereForm = createFormAction(dosomething, {
  interceptors: [
    onSuccess(async () => {
      redirect('/some-where')
    }),
  ],
})

export function MyComponent() {
  return (
    <form action={redirectSomeWhereForm}>
      <input type="text" name="user[name]" required />
      <input type="number" name="user[age]" required />
      <button type="submit">Submit</button>
    </form>
  )
}
```

By moving the `redirect('/some-where')` logic into `createFormAction` rather than the procedure, you enhance the procedure's reusability beyond Server Actions.

::: info
When using `createFormAction`, any `ORPCError` with a status of `401`, `403`, or `404` is automatically converted into the corresponding Next.js error responses: [unauthorized](https://nextjs.org/docs/app/api-reference/functions/unauthorized), [forbidden](https://nextjs.org/docs/app/api-reference/functions/forbidden), and [not found](https://nextjs.org/docs/app/api-reference/functions/not-found).
:::
