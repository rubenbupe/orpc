---
title: Event Iterator (SSE)
description: Learn how to streaming responses, real-time updates, and server-sent events using oRPC.
---

# Event Iterator (SSE)

oRPC provides built‑in support for streaming responses, real‑time updates, and server-sent events (SSE) without any extra configuration. This functionality is ideal for applications that require live updates—such as AI chat responses, live sports scores, or stock market data.

## Overview

The event iterator is defined by an asynchronous generator function. In the example below, the handler continuously yields a new event every second:

```ts
const example = os
  .handler(async function* ({ input, lastEventId }) {
    while (true) {
      yield { message: 'Hello, world!' }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  })
```

Learn how to consume the event iterator on the client [here](/docs/client/event-iterator)

## Validate Event Iterator

oRPC includes a built‑in `eventIterator` helper that works with any [Standard Schema](https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec) library to validate events.

```ts
import { eventIterator } from '@rubenbupe/orpc-server'

const example = os
  .output(eventIterator(z.object({ message: z.string() })))
  .handler(async function* ({ input, lastEventId }) {
    while (true) {
      yield { message: 'Hello, world!' }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  })
```

## Last Event ID & Event Metadata

Using the `withEventMeta` helper, you can attach [additional event meta](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format) (such as an event ID or a retry interval) to each event. On reconnect, oRPC passes the last event ID back to the handler so you can resume the stream appropriately.

```ts
import { withEventMeta } from '@rubenbupe/orpc-server'

const example = os
  .handler(async function* ({ input, lastEventId }) {
    if (lastEventId) {
      // Resume streaming from lastEventId
    }
    else {
      while (true) {
        yield withEventMeta({ message: 'Hello, world!' }, { id: 'some-id', retry: 10_000 })
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  })
```

## Stop Event Iterator

To signal the end of the stream, simply use a `return` statement. When the handler returns, oRPC marks the stream as successfully completed and does not attempt to reconnect.

```ts
const example = os
  .handler(async function* ({ input, lastEventId }) {
    while (true) {
      if (done) {
        return
      }

      yield { message: 'Hello, world!' }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  })
```

## Cleanup Side-Effects

If the client closes the connection or an unexpected error occurs, you can use a `finally` block to clean up any side effects (for example, closing database connections or stopping background tasks):

```ts
const example = os
  .handler(async function* ({ input, lastEventId }) {
    try {
      while (true) {
        yield { message: 'Hello, world!' }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    finally {
      console.log('Cleanup logic here')
    }
  })
```
