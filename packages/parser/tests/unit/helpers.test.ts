import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { JSONStringified } from '../../src/helpers.js';
import { AlbSchema } from '../../src/schemas/alb.js';
import {
  SnsNotificationSchema,
  SnsRecordSchema,
} from '../../src/schemas/sns.js';
import { SqsRecordSchema, SqsSchema } from '../../src/schemas/sqs.js';
import type { SnsEvent, SqsEvent } from '../../src/types/schema.js';
import { getTestEvent } from './helpers/utils.js';

const bodySchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});
const envelopeSchema = z.object({
  body: z.string(),
});
const basePayload = {
  id: 1,
  name: 'John Doe',
  email: 'foo@bar.baz',
};

describe('Helper: JSONStringified', () => {
  it('should return a valid JSON', () => {
    // Prepare
    const data = {
      body: JSON.stringify(structuredClone(basePayload)),
    };

    // Act
    const extendedSchema = envelopeSchema.extend({
      body: JSONStringified(bodySchema),
    });

    // Assess
    expect(extendedSchema.parse(data)).toStrictEqual({
      body: basePayload,
    });
  });

  it('should throw an error if the JSON payload is invalid', () => {
    // Prepare
    const data = {
      body: JSON.stringify({ ...basePayload, email: 'invalid' }),
    };

    // Act
    const extendedSchema = envelopeSchema.extend({
      body: JSONStringified(bodySchema),
    });

    // Assess
    expect(() => extendedSchema.parse(data)).toThrow();
  });

  it('should throw an error if the JSON is malformed', () => {
    // Prepare
    const data = {
      body: 'invalid',
    };

    // Act
    const extendedSchema = envelopeSchema.extend({
      body: JSONStringified(bodySchema),
    });

    // Assess
    expect(() => extendedSchema.parse(data)).toThrow();
  });

  it('should parse extended AlbSchema', () => {
    // Prepare
    const testEvent = getTestEvent({
      eventsPath: 'alb',
      filename: 'base',
    });
    testEvent.body = JSON.stringify(structuredClone(basePayload));

    // Act
    const extendedSchema = AlbSchema.extend({
      body: JSONStringified(bodySchema),
    });

    // Assess
    expect(extendedSchema.parse(testEvent)).toStrictEqual({
      ...testEvent,
      body: basePayload,
    });
  });

  it('should parse extended SqsSchema', () => {
    // Prepare
    const testEvent = getTestEvent<SqsEvent>({
      eventsPath: 'sqs',
      filename: 'base',
    });
    const stringifiedBody = JSON.stringify(basePayload);
    testEvent.Records[0].body = stringifiedBody;
    testEvent.Records[1].body = stringifiedBody;

    // Act
    const extendedSchema = SqsSchema.extend({
      Records: z.array(
        SqsRecordSchema.extend({
          body: JSONStringified(bodySchema),
        })
      ),
    });

    // Assess
    expect(extendedSchema.parse(testEvent)).toStrictEqual({
      ...testEvent,
      Records: [
        { ...testEvent.Records[0], body: basePayload },
        { ...testEvent.Records[1], body: basePayload },
      ],
    });
  });

  it('should parse extended SnsSchema', () => {
    // Prepare
    const testEvent = getTestEvent<SnsEvent>({
      eventsPath: 'sns',
      filename: 'base',
    });
    testEvent.Records[0].Sns.Message = JSON.stringify(basePayload);

    // Act
    const extendedSchema = SqsSchema.extend({
      Records: z.array(
        SnsRecordSchema.extend({
          Sns: SnsNotificationSchema.extend({
            Message: JSONStringified(bodySchema),
          }),
        })
      ),
    });

    // Assess
    expect(extendedSchema.parse(testEvent)).toStrictEqual({
      ...testEvent,
      Records: [
        {
          ...testEvent.Records[0],
          Sns: { ...testEvent.Records[0].Sns, Message: basePayload },
        },
      ],
    });
  });
});
