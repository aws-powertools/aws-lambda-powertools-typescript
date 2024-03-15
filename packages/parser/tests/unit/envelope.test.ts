import { z, ZodError } from 'zod';
import { Envelope } from '../../src/envelopes/envelope.js';

describe('envelope: ', () => {
  describe('parseSafe', () => {
    it('returns success response when input is object', () => {
      const result = Envelope.safeParse(
        '{"name": "John"}',
        z.object({ name: z.string() })
      );
      expect(result).toEqual({
        success: true,
        data: { name: 'John' },
      });
    });
    it('returns success response when input is string', () => {
      const result = Envelope.safeParse(
        { name: 'John' },
        z.object({ name: z.string() })
      );
      expect(result).toEqual({
        success: true,
        data: { name: 'John' },
      });
    });
    it('returns error when input does not match schema', () => {
      const result = Envelope.safeParse(
        { name: 123 },
        z.object({ name: z.string() })
      );
      expect(result).toEqual({
        success: false,
        error: expect.any(ZodError),
        originalEvent: { name: 123 },
      });
    });

    it('returns error when input is invalid JSON string', () => {
      let err: unknown;
      try {
        JSON.parse('{name: "John"}');
      } catch (e) {
        err = e;
      }
      const result = Envelope.safeParse(
        '{name: "John"}',
        z.object({ name: z.string() })
      );
      expect(result).toEqual({
        success: false,
        error: err,
        originalEvent: '{name: "John"}',
      });
    });
  });

  describe('parse', () => {
    it('returns parsed data when input is object', () => {
      const result = Envelope.parse(
        { name: 'John' },
        z.object({ name: z.string() })
      );
      expect(result).toEqual({ name: 'John' });
    });
    it('returns parsed data when input is string', () => {
      const result = Envelope.parse(
        '{"name": "John"}',
        z.object({ name: z.string() })
      );
      expect(result).toEqual({ name: 'John' });
    });
    it('throw custom error if input is not string or object', () => {
      expect(() => Envelope.parse(123, z.object({ name: z.string() }))).toThrow(
        'Invalid data type for envelope. Expected string or object, got number'
      );
    });
    it('throws error when input does not match schema', () => {
      expect(() =>
        Envelope.parse({ name: 123 }, z.object({ name: z.string() }))
      ).toThrow();
    });
  });
});
