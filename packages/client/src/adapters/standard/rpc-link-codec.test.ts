import * as StandardServer from '@rubenbupe/orpc-standard-server'
import * as ErrorModule from '../../error'
import { StandardRPCJsonSerializer } from './rpc-json-serializer'
import { StandardRPCLinkCodec } from './rpc-link-codec'
import { StandardRPCSerializer } from './rpc-serializer'

const ORPCError = ErrorModule.ORPCError
const isORPCErrorStatusSpy = vi.spyOn(ErrorModule, 'isORPCErrorStatus')
const mergeStandardHeadersSpy = vi.spyOn(StandardServer, 'mergeStandardHeaders')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('standardRPCLinkCodec', () => {
  const serializer = new StandardRPCSerializer(new StandardRPCJsonSerializer())

  const serializeSpy = vi.spyOn(serializer, 'serialize')
  const deserializeSpy = vi.spyOn(serializer, 'deserialize')

  describe('encode', () => {
    const method = vi.fn()
    const codec = new StandardRPCLinkCodec(serializer, {
      url: 'http://localhost:3000',
      method,
      headers: () => ({ 'x-custom-header': 'custom-value' }),
    })

    it('with method=GET', async () => {
      method.mockResolvedValueOnce('GET')

      const signal = AbortSignal.timeout(100)
      const output = await codec.encode(['test'], 'input', { context: {}, signal })

      expect(output).toEqual(expect.objectContaining({
        url: new URL(`http://localhost:3000/test?data=${encodeURIComponent(JSON.stringify(serializeSpy.mock.results[0]!.value))}`),
        method: 'GET',
        headers: {
          'x-custom-header': 'custom-value',
        },
        body: undefined,
        signal,
      }))
    })

    it('with method=POST', async () => {
      method.mockResolvedValueOnce('POST')

      const signal = AbortSignal.timeout(100)
      const output = await codec.encode(['test'], 'input', { context: {}, signal })

      expect(output).toEqual(expect.objectContaining({
        url: new URL(`http://localhost:3000/test`),
        method: 'POST',
        headers: {
          'x-custom-header': 'custom-value',
        },
        body: serializeSpy.mock.results[0]!.value,
        signal,
      }))
    })

    it.each([
      ['exceeds max length', '_'.repeat(100)],
      ['blob', new Blob(['blob'], { type: 'text/plain' })],
      ['blob inside', { blob: new Blob(['blob'], { type: 'text/plain' }) }],
      ['event-iterator', (async function* () { })()],
    ])('fallback method when method=GET: %s', async (_, input) => {
      const codec = new StandardRPCLinkCodec(serializer, {
        url: 'http://localhost:3000',
        method: 'GET',
        maxUrlLength: 100,
        fallbackMethod: 'PATCH',
      })

      const output = await codec.encode(['test'], input, { context: {} })

      expect(output).toEqual(expect.objectContaining({
        url: new URL(`http://localhost:3000/test`),
        method: 'PATCH',
        headers: {},
        body: serializeSpy.mock.results[0]!.value,
      }))

      expect(serializeSpy).toBeCalledTimes(1)
      expect(serializeSpy).toBeCalledWith(input)
    })

    it('last-event-id', async () => {
      const codec = new StandardRPCLinkCodec(serializer, {
        url: 'http://localhost:3000',
        method,
        headers: () => ({ 'x-custom-header': 'custom-value' }),
      })

      const request = await codec.encode(['test'], 'input', { context: {}, lastEventId: '1' })

      expect(request.headers['last-event-id']).toEqual('1')

      expect(mergeStandardHeadersSpy).toBeCalledWith({ 'x-custom-header': 'custom-value' }, { 'last-event-id': '1' })
      expect(mergeStandardHeadersSpy).toBeCalledTimes(1)
      expect(request.headers).toBe(mergeStandardHeadersSpy.mock.results[0]!.value)
    })
  })

  describe('decode', () => {
    const codec = new StandardRPCLinkCodec(serializer, {
      url: 'http://localhost:3000',
    })

    it('should decode output', async () => {
      const serialized = serializer.serialize({
        data: 'hello world',
      })

      const output = await codec.decode({
        status: 200,
        headers: {},
        body: () => Promise.resolve(serialized),
      })

      expect(output).toEqual(deserializeSpy.mock.results[0]!.value)

      expect(deserializeSpy).toBeCalledTimes(1)
      expect(deserializeSpy).toBeCalledWith(serialized)

      expect(isORPCErrorStatusSpy).toBeCalledTimes(1)
      expect(isORPCErrorStatusSpy).toBeCalledWith(200)
    })

    it('should decode error', async () => {
      const error = new ORPCError('TEST', {
        data: {
          message: 'hello world',
        },
      })

      const serialized = serializer.serialize(error.toJSON())

      await expect(codec.decode({
        status: 499,
        headers: {},
        body: () => Promise.resolve(serialized),
      })).rejects.toSatisfy((e) => {
        expect(e).toEqual(error)

        return true
      })

      expect(deserializeSpy).toBeCalledTimes(1)
      expect(deserializeSpy).toBeCalledWith(serialized)

      expect(isORPCErrorStatusSpy).toBeCalledTimes(1)
      expect(isORPCErrorStatusSpy).toBeCalledWith(499)
    })

    it('error: Cannot parse response body', async () => {
      await expect(codec.decode({
        status: 200,
        headers: {},
        body: () => {
          throw new Error('test')
        },
      })).rejects.toThrow('Cannot parse response body, please check the response body and content-type.')

      expect(deserializeSpy).toBeCalledTimes(0)
    })

    it('error: Invalid RPC response format.', async () => {
      await expect(codec.decode({
        status: 200,
        headers: {},
        body: () => Promise.resolve({ meta: 123 }),
      })).rejects.toThrow('Invalid RPC response format.')

      expect(deserializeSpy).toBeCalledTimes(1)
      expect(deserializeSpy).toBeCalledWith({ meta: 123 })
    })

    it('error: Invalid RPC error response format.', async () => {
      const error = new ORPCError('TEST', {
        data: {
          message: 'hello world',
        },
      })

      const serialized = serializer.serialize({
        ...error.toJSON(),
        code: undefined,
      }) as any

      await expect(codec.decode({
        status: 403,
        headers: {},
        body: () => Promise.resolve(serialized),
      })).rejects.toThrow('MALFORMED_ORPC_ERROR_RESPONSE')

      expect(deserializeSpy).toBeCalledTimes(1)
      expect(deserializeSpy).toBeCalledWith(serialized)
    })
  })
})
