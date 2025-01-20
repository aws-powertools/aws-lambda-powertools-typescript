import type { ZodError, ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { EventBridgeSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * Envelope for EventBridge schema that extracts and parses data from the `detail` key.
 */
export const EventBridgeEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'object' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const extendedSchema = EventBridgeSchema.extend({
      detail: schema,
    });
    try {
      const parsed = extendedSchema.parse(data);
      return parsed.detail;
    } catch (error) {
      throw new ParseError('Failed to parse EventBridge envelope', {
        cause: error as ZodError,
      });
    }
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>> {
    const extendedSchema = EventBridgeSchema.extend({
      detail: schema,
    });

    const parsedResult = extendedSchema.safeParse(data);
    if (!parsedResult.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse EventBridge envelope', {
          cause: parsedResult.error,
        }),
        originalEvent: data,
      };
    }

    return {
      success: true,
      data: parsedResult.data.detail,
    };
  },
};
