import { marshall } from '@aws-sdk/util-dynamodb';
import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { DynamoDBStreamEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type { DynamoDBStreamEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../schema/utils.js';

describe('Envelope: DynamoDB Stream', () => {
  const schema = z.object({
    Message: z.string(),
    Id: z.number(),
  });
  const baseEvent = getTestEvent<DynamoDBStreamEvent>({
    eventsPath: 'dynamodb',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('throws if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => DynamoDBStreamEnvelope.parse(event, z.number())).toThrow();
    });

    it('parse should parse dynamodb envelope', () => {
      // Prepare
      const testEvent = structuredClone(baseEvent);

      // Act
      const parsed = DynamoDBStreamEnvelope.parse(testEvent, schema);

      // Assess
      expect(parsed[0]).toEqual({
        NewImage: {
          Message: 'New item!',
          Id: 101,
        },
      });
      expect(parsed[1]).toEqual({
        OldImage: {
          Message: 'New item!',
          Id: 101,
        },
        NewImage: {
          Message: 'This item has changed',
          Id: 101,
        },
      });
    });
  });

  describe('Method: safeParse', () => {
    it('parses a DynamoDB Stream event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const parsedEvent = DynamoDBStreamEnvelope.safeParse(event, schema);

      // Assess
      expect(parsedEvent).toEqual({
        success: true,
        data: [
          {
            NewImage: {
              Message: 'New item!',
              Id: 101,
            },
          },
          {
            OldImage: {
              Message: 'New item!',
              Id: 101,
            },
            NewImage: {
              Message: 'This item has changed',
              Id: 101,
            },
          },
        ],
      });
    });

    it('returns an error if the event is not a valid DynamoDB Stream event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      // @ts-expect-error - Intentionally invalid event
      event.Records[0].dynamodb = undefined;

      // Act
      const parsedEvent = DynamoDBStreamEnvelope.safeParse(event, schema);

      // Assess
      expect(parsedEvent).toEqual({
        success: false,
        error: new ParseError('Failed to parse DynamoDB Stream envelope', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'object',
              received: 'undefined',
              path: ['Records', 0, 'dynamodb'],
              message: 'Required',
            },
          ]),
        }),
        originalEvent: event,
      });
    });

    it('returns an error if any of the records fail to parse', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[1].dynamodb.NewImage = marshall({
        Message: 42,
        Id: 101,
      });

      // Act
      const parsedEvent = DynamoDBStreamEnvelope.safeParse(event, schema);

      // Assess
      expect(parsedEvent).toEqual({
        success: false,
        error: new ParseError('Failed to parse record at index 1', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['Records', 1, 'dynamodb', 'NewImage', 'Message'],
              message: 'Expected string, received number',
            },
          ]),
        }),
        originalEvent: event,
      });
    });
  });
});
