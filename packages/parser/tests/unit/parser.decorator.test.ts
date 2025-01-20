import { generateMock } from '@anatine/zod-mock';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/lib/esm/types';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/index.js';
import { ParseError } from '../../src/errors.js';
import { parser } from '../../src/index.js';
import { EventBridgeSchema } from '../../src/schemas/index.js';
import type { EventBridgeEvent, ParsedResult } from '../../src/types';
import { TestEvents, TestSchema, getTestEvent } from './schema/utils';

describe('Parser Decorator', () => {
  const customEventBridgeSchema = EventBridgeSchema.extend({
    detail: TestSchema,
  });

  type TestEvent = z.infer<typeof TestSchema>;

  class TestClass implements LambdaInterface {
    @parser({ schema: TestSchema })
    public async handler(
      event: TestEvent,
      _context: Context
    ): Promise<TestEvent> {
      return event;
    }

    @parser({ schema: customEventBridgeSchema })
    public async handlerWithCustomSchema(
      event: unknown,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({ schema: TestSchema, envelope: EventBridgeEnvelope })
    public async handlerWithParserCallsAnotherMethod(
      event: TestEvent,
      _context: Context
    ): Promise<unknown> {
      return this.anotherMethod(event);
    }

    @parser({ schema: TestSchema, envelope: EventBridgeEnvelope })
    public async handlerWithSchemaAndEnvelope(
      event: TestEvent,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({
      schema: TestSchema,
      safeParse: true,
    })
    public async handlerWithSchemaAndSafeParse(
      event: ParsedResult<unknown, TestEvent>,
      _context: Context
    ): Promise<ParsedResult> {
      return event;
    }

    @parser({
      schema: TestSchema,
      envelope: EventBridgeEnvelope,
      safeParse: true,
    })
    public async harndlerWithEnvelopeAndSafeParse(
      event: ParsedResult<TestEvent, TestEvent>,
      _context: Context
    ): Promise<ParsedResult> {
      return event;
    }

    private async anotherMethod(event: TestEvent): Promise<TestEvent> {
      return event;
    }
  }

  const lambda = new TestClass();

  it('should parse custom schema event', async () => {
    const testEvent = generateMock(TestSchema);

    const resp = await lambda.handler(testEvent, {} as Context);

    expect(resp).toEqual(testEvent);
  });

  it('should parse custom schema with envelope event', async () => {
    const customPayload = generateMock(TestSchema);
    const testEvent = getTestEvent<EventBridgeEvent>({
      eventsPath: 'eventbridge',
      filename: 'base',
    });
    testEvent.detail = customPayload;

    const resp = await lambda.handlerWithSchemaAndEnvelope(
      testEvent as unknown as TestEvent,
      {} as Context
    );

    expect(resp).toEqual(customPayload);
  });

  it('should parse extended envelope event', async () => {
    const customPayload = generateMock(TestSchema);

    const testEvent = generateMock(customEventBridgeSchema);
    testEvent.detail = customPayload;

    const resp: z.infer<typeof customEventBridgeSchema> =
      (await lambda.handlerWithCustomSchema(
        testEvent,
        {} as Context
      )) as z.infer<typeof customEventBridgeSchema>;

    expect(customEventBridgeSchema.parse(resp)).toEqual(testEvent);
    expect(resp.detail).toEqual(customPayload);
  });

  it('should parse and call private async method', async () => {
    const customPayload = generateMock(TestSchema);
    const testEvent = getTestEvent<EventBridgeEvent>({
      eventsPath: 'eventbridge',
      filename: 'base',
    });
    testEvent.detail = customPayload;

    const resp = await lambda.handlerWithParserCallsAnotherMethod(
      testEvent as unknown as TestEvent,
      {} as Context
    );

    expect(resp).toEqual(customPayload);
  });

  it('should parse event with schema and safeParse', async () => {
    const testEvent = generateMock(TestSchema);

    const resp = await lambda.handlerWithSchemaAndSafeParse(
      testEvent as unknown as ParsedResult<unknown, TestEvent>,
      {} as Context
    );

    expect(resp).toEqual({
      success: true,
      data: testEvent,
    });
  });

  it('should parse event with schema and safeParse and return error', async () => {
    expect(
      await lambda.handlerWithSchemaAndSafeParse(
        { foo: 'bar' } as unknown as ParsedResult<unknown, TestEvent>,
        {} as Context
      )
    ).toEqual({
      error: expect.any(ParseError),
      success: false,
      originalEvent: { foo: 'bar' },
    });
  });

  it('should parse event with envelope and safeParse', async () => {
    const testEvent = generateMock(TestSchema);
    const event = getTestEvent<EventBridgeEvent>({
      eventsPath: 'eventbridge',
      filename: 'base',
    });
    event.detail = testEvent;

    const resp = await lambda.harndlerWithEnvelopeAndSafeParse(
      event as unknown as ParsedResult<TestEvent, TestEvent>,
      {} as Context
    );

    expect(resp).toEqual({
      success: true,
      data: testEvent,
    });
  });

  it('should parse event with envelope and safeParse and return error', async () => {
    expect(
      await lambda.harndlerWithEnvelopeAndSafeParse(
        { foo: 'bar' } as unknown as ParsedResult<TestEvent, TestEvent>,
        {} as Context
      )
    ).toEqual({
      error: expect.any(ParseError),
      success: false,
      originalEvent: { foo: 'bar' },
    });
  });
});
