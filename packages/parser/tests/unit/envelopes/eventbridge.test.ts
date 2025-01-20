import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { EventBridgeEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type { EventBridgeEvent } from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../schema/utils.js';

describe('Envelope: EventBridgeEnvelope', () => {
  const schema = z.object({
    instance_id: z.string(),
    state: z.string(),
  });
  const baseEvent = getTestEvent<EventBridgeEvent>({
    eventsPath: 'eventbridge',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('throws if the payload does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() =>
        EventBridgeEnvelope.parse(
          event,
          z.object({
            owner: z.string(),
          })
        )
      ).toThrow(
        expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse EventBridge envelope'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'string',
                received: 'undefined',
                path: ['detail', 'owner'],
                message: 'Required',
              },
            ],
          }),
        })
      );
    });

    it('parses an EventBridge event', () => {
      // Prepare
      const testEvent = structuredClone(baseEvent);

      // Act
      const result = EventBridgeEnvelope.parse(testEvent, schema);

      // Assess
      expect(result).toStrictEqual({
        instance_id: 'i-1234567890abcdef0',
        state: 'terminated',
      });
    });
  });

  describe('Method: safeParse', () => {
    it('parses an EventBridge event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = EventBridgeEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: true,
        data: {
          instance_id: 'i-1234567890abcdef0',
          state: 'terminated',
        },
      });
    });

    it('returns an error if the event is not a valid EventBridge event', () => {
      // Prepare
      const event = omit(['detail'], structuredClone(baseEvent));

      // Act
      const result = EventBridgeEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: new ParseError('Failed to parse EventBridge envelope', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'object',
              received: 'undefined',
              path: ['detail'],
              message: 'Required',
            },
          ]),
        }),
        originalEvent: event,
      });
    });
  });
});
