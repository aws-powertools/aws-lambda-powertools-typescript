import { generateMock } from '@anatine/zod-mock';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import type { ZodSchema, z } from 'zod';
import { ParseError } from '../../src';
import { EventBridgeEnvelope, SqsEnvelope } from '../../src/envelopes';
import { parser } from '../../src/middleware/parser.js';
import { SqsSchema } from '../../src/schemas';
import type { EventBridgeEvent, ParsedResult, SqsEvent } from '../../src/types';
import { TestEvents, TestSchema, getTestEvent } from './schema/utils';

describe('Middleware: parser', () => {
  type TestEvent = z.infer<typeof TestSchema>;
  const handler = async (
    event: unknown,
    _context: Context
  ): Promise<unknown> => {
    return event;
  };

  describe(' when envelope is provided ', () => {
    const middyfiedHandlerSchemaEnvelope = middy()
      .use(parser({ schema: TestSchema, envelope: SqsEnvelope }))
      .handler(async (event, _): Promise<TestEvent[]> => {
        return event;
      });
    it('should parse request body with schema and envelope', async () => {
      const bodyMock = generateMock(TestSchema);

      const event = generateMock(SqsSchema, {
        stringMap: {
          body: () => JSON.stringify(bodyMock),
        },
      });

      const result = (await middyfiedHandlerSchemaEnvelope(
        event as unknown as TestEvent[],
        {} as Context
      )) as TestEvent[];
      for (const item of result) {
        expect(item).toEqual(bodyMock);
      }
    });

    it('should throw when envelope does not match', async () => {
      await expect(async () => {
        await middyfiedHandlerSchemaEnvelope(
          { name: 'John', age: 18 } as unknown as TestEvent[],
          {} as Context
        );
      }).rejects.toThrow();
    });

    it('should throw when schema does not match', async () => {
      const event = generateMock(SqsSchema, {
        stringMap: {
          body: () => '42',
        },
      });

      await expect(
        middyfiedHandlerSchemaEnvelope(
          event as unknown as TestEvent[],
          {} as Context
        )
      ).rejects.toThrow();
    });

    it('should throw when provided schema is invalid', async () => {
      const middyfiedHandler = middy(handler).use(
        parser({ schema: {} as ZodSchema, envelope: SqsEnvelope })
      );

      await expect(
        middyfiedHandler(42 as unknown as TestEvent[], {} as Context)
      ).rejects.toThrow();
    });

    it('should throw when envelope is correct but schema is invalid', async () => {
      const event = generateMock(SqsSchema, {
        stringMap: {
          body: () => JSON.stringify({ name: 'John', foo: 'bar' }),
        },
      });

      const middyfiedHandler = middy(handler).use(
        parser({ schema: {} as ZodSchema, envelope: SqsEnvelope })
      );

      await expect(
        middyfiedHandler(event as unknown as TestEvent[], {} as Context)
      ).rejects.toThrow();
    });
  });

  describe(' when envelope is not provided', () => {
    it('should parse the event with built-in schema', async () => {
      const event = generateMock(SqsSchema);

      const middyfiedHandler = middy()
        .use(parser({ schema: SqsSchema }))
        .handler(async (event, _) => {
          return event;
        });

      expect(
        await middyfiedHandler(event as unknown as SqsEvent, {} as Context)
      ).toEqual(event);
    });

    it('should parse custom event', async () => {
      const event = { name: 'John', age: 18 };
      const middyfiedHandler = middy()
        .use(parser({ schema: TestSchema }))
        .handler(async (event, _): Promise<TestEvent> => {
          return event;
        });

      expect(
        await middyfiedHandler(event as unknown as TestEvent, {} as Context)
      ).toEqual(event);
    });

    it('should throw when the schema does not match', async () => {
      const middyfiedHandler = middy(handler).use(
        parser({ schema: TestSchema })
      );

      await expect(
        middyfiedHandler(42 as unknown as TestEvent, {} as Context)
      ).rejects.toThrow();
    });

    it('should throw when provided schema is invalid', async () => {
      const middyfiedHandler = middy(handler).use(
        parser({ schema: {} as ZodSchema })
      );

      await expect(
        middyfiedHandler({ foo: 'bar' } as unknown as TestEvent, {} as Context)
      ).rejects.toThrow();
    });

    it('should return the event when safeParse is true', async () => {
      const event = { name: 'John', age: 18 };
      const middyfiedHandler = middy()
        .use(parser({ schema: TestSchema, safeParse: true }))
        .handler(
          async (event, _): Promise<ParsedResult<unknown, TestEvent>> => {
            return event;
          }
        );

      expect(
        await middyfiedHandler(
          event as unknown as ParsedResult<unknown, TestEvent>,
          {} as Context
        )
      ).toEqual({
        success: true,
        data: event,
      });
    });

    it('should return error when safeParse is true and schema does not match', async () => {
      const middyfiedHandler = middy(handler).use(
        parser({ schema: TestSchema, safeParse: true })
      );

      expect(
        await middyfiedHandler(
          42 as unknown as ParsedResult<unknown, TestEvent>,
          {} as Context
        )
      ).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: 42,
      });
    });

    it('should return event when envelope and safeParse are true', async () => {
      const detail = generateMock(TestSchema);
      const event = getTestEvent<EventBridgeEvent>({
        eventsPath: 'eventbridge',
        filename: 'base',
      });

      event.detail = detail;

      const middyfiedHandler = middy()
        .use(
          parser({
            schema: TestSchema,
            envelope: EventBridgeEnvelope,
            safeParse: true,
          })
        )
        .handler(
          async (event, _): Promise<ParsedResult<unknown, TestEvent>> => {
            return event;
          }
        );

      expect(
        await middyfiedHandler(
          event as unknown as ParsedResult<unknown, TestEvent>,
          {} as Context
        )
      ).toEqual({
        success: true,
        data: detail,
      });
    });

    it('should return error when envelope provided, safeParse is true, and schema does not match', async () => {
      const event = getTestEvent<EventBridgeEvent>({
        eventsPath: 'eventbridge',
        filename: 'base',
      });

      const middyfiedHandler = middy()
        .use(
          parser({
            schema: TestSchema,
            envelope: EventBridgeEnvelope,
            safeParse: true,
          })
        )
        .handler(
          async (event, _): Promise<ParsedResult<unknown, TestEvent>> => {
            return event;
          }
        );
      expect(
        await middyfiedHandler(
          event as unknown as ParsedResult<unknown, TestEvent>,
          {} as Context
        )
      ).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });
  });
});
