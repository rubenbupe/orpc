import { isDefinedError } from '@rubenbupe/orpc-client'
import { ORPCError } from '@rubenbupe/orpc-contract'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { pingHandler } from '../../server/tests/shared'
import { orpc, queryClient } from './shared'

beforeEach(() => {
  queryClient.clear()
  vi.clearAllMocks()
})

it('case: call directly', async () => {
  expect(await orpc.ping.call({ input: 123 })).toEqual({ output: '123' })
})

it('case: with useQuery', async () => {
  const { result } = renderHook(() => useQuery(orpc.nested.ping.queryOptions({ input: { input: 123 } }), queryClient))

  expect(queryClient.isFetching({ queryKey: orpc.key() })).toEqual(1)
  expect(queryClient.isFetching({ queryKey: orpc.nested.key() })).toEqual(1)
  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key() })).toEqual(1)
  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key({ input: { input: 123 } }) })).toEqual(1)
  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key({ input: { input: 123 }, type: 'query' }) })).toEqual(1)

  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key({ input: { input: 234 }, type: 'query' }) })).toEqual(0)
  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key({ input: { input: 123 }, type: 'infinite' }) })).toEqual(0)
  expect(queryClient.isFetching({ queryKey: orpc.nested.pong.key() })).toEqual(0)
  expect(queryClient.isFetching({ queryKey: orpc.ping.key() })).toEqual(0)
  expect(queryClient.isFetching({ queryKey: orpc.pong.key() })).toEqual(0)

  await vi.waitFor(() => expect(result.current.data).toEqual({ output: '123' }))

  expect(
    queryClient.getQueryData(orpc.nested.ping.key({ input: { input: 123 }, type: 'query' })),
  ).toEqual({ output: '123' })

  pingHandler.mockRejectedValueOnce(new ORPCError('OVERRIDE'))

  result.current.refetch()

  await vi.waitFor(() => {
    expect((result as any).current.error).toBeInstanceOf(ORPCError)
    expect((result as any).current.error).toSatisfy(isDefinedError)
    expect((result as any).current.error.code).toEqual('OVERRIDE')
  })
})

it('case: with useInfiniteQuery', async () => {
  const { result } = renderHook(() => useInfiniteQuery(orpc.nested.ping.infiniteOptions({
    input: pageParam => ({ input: pageParam }),
    getNextPageParam: lastPage => Number(lastPage.output) + 1,
    initialPageParam: 1,
  }), queryClient))

  expect(queryClient.isFetching({ queryKey: orpc.key() })).toEqual(1)
  expect(queryClient.isFetching({ queryKey: orpc.nested.key() })).toEqual(1)
  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key() })).toEqual(1)
  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key({ input: { input: 1 } }) })).toEqual(1)
  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key({ input: { input: 1 }, type: 'infinite' }) })).toEqual(1)

  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key({ input: { input: 2 }, type: 'infinite' }) })).toEqual(0)
  expect(queryClient.isFetching({ queryKey: orpc.nested.ping.key({ input: { input: 1 }, type: 'query' }) })).toEqual(0)
  expect(queryClient.isFetching({ queryKey: orpc.nested.pong.key() })).toEqual(0)
  expect(queryClient.isFetching({ queryKey: orpc.ping.key() })).toEqual(0)
  expect(queryClient.isFetching({ queryKey: orpc.pong.key() })).toEqual(0)

  await vi.waitFor(() => expect(result.current.data).toEqual({
    pageParams: [1],
    pages: [
      { output: '1' },
    ],
  }))

  expect(
    queryClient.getQueryData(orpc.nested.ping.key({ input: { input: 1 }, type: 'infinite' })),
  ).toEqual({
    pageParams: [1],
    pages: [
      { output: '1' },
    ],
  })

  result.current.fetchNextPage()

  await vi.waitFor(() => expect(result.current.data).toEqual({
    pageParams: [1, 2],
    pages: [
      { output: '1' },
      { output: '2' },
    ],
  }))

  expect(
    queryClient.getQueryData(orpc.nested.ping.key({ input: { input: 1 }, type: 'infinite' })),
  ).toEqual({
    pageParams: [1, 2],
    pages: [
      { output: '1' },
      { output: '2' },
    ],
  })

  pingHandler.mockRejectedValueOnce(new ORPCError('OVERRIDE'))

  result.current.fetchNextPage()

  await vi.waitFor(() => {
    expect((result as any).current.error).toBeInstanceOf(ORPCError)
    expect((result as any).current.error).toSatisfy(isDefinedError)
    expect((result as any).current.error.code).toEqual('OVERRIDE')
  })
})

it('case: with useMutation', async () => {
  const { result } = renderHook(() => useMutation(orpc.nested.ping.mutationOptions(), queryClient))

  result.current.mutate({ input: 123 })

  expect(queryClient.isMutating({ mutationKey: orpc.key() })).toEqual(1)
  expect(queryClient.isMutating({ mutationKey: orpc.nested.key() })).toEqual(1)
  expect(queryClient.isMutating({ mutationKey: orpc.nested.ping.key() })).toEqual(1)
  expect(queryClient.isMutating({ mutationKey: orpc.nested.ping.key({ type: 'mutation' }) })).toEqual(1)

  expect(queryClient.isMutating({ mutationKey: orpc.nested.ping.key({ type: 'query' }) })).toEqual(0)
  expect(queryClient.isMutating({ mutationKey: orpc.nested.pong.key() })).toEqual(0)
  expect(queryClient.isMutating({ mutationKey: orpc.ping.key() })).toEqual(0)
  expect(queryClient.isMutating({ mutationKey: orpc.pong.key() })).toEqual(0)

  await vi.waitFor(() => expect(result.current.data).toEqual({ output: '123' }))

  pingHandler.mockRejectedValueOnce(new ORPCError('OVERRIDE'))

  result.current.mutate({ input: 456 })

  await vi.waitFor(() => {
    expect((result as any).current.error).toBeInstanceOf(ORPCError)
    expect((result as any).current.error).toSatisfy(isDefinedError)
    expect((result as any).current.error.code).toEqual('OVERRIDE')
  })
})
