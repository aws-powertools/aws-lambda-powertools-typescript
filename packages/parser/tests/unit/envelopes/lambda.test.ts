import { generateMock } from '@anatine/zod-mock';
import type {
  APIGatewayProxyEventV2,
  LambdaFunctionURLEvent,
} from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { ParseError } from '../../../src';
import { LambdaFunctionUrlEnvelope } from '../../../src/envelopes/index.js';
import { TestEvents, TestSchema } from '../schema/utils.js';

describe('Lambda Functions Url ', () => {
  describe('parse', () => {
    it('should parse custom schema in envelope', () => {
      const testEvent =
        TestEvents.lambdaFunctionUrlEvent as APIGatewayProxyEventV2;
      const data = generateMock(TestSchema);

      testEvent.body = JSON.stringify(data);

      expect(LambdaFunctionUrlEnvelope.parse(testEvent, TestSchema)).toEqual(
        data
      );
    });

    it('should throw when no body provided', () => {
      const testEvent =
        TestEvents.lambdaFunctionUrlEvent as LambdaFunctionURLEvent;
      testEvent.body = undefined;

      expect(() =>
        LambdaFunctionUrlEnvelope.parse(testEvent, TestSchema)
      ).toThrow();
    });

    it('should throw when envelope is not valid', () => {
      expect(() =>
        LambdaFunctionUrlEnvelope.parse({ foo: 'bar' }, TestSchema)
      ).toThrow();
    });

    it('should throw when body does not match schema', () => {
      const testEvent =
        TestEvents.lambdaFunctionUrlEvent as APIGatewayProxyEventV2;
      testEvent.body = JSON.stringify({ foo: 'bar' });

      expect(() =>
        LambdaFunctionUrlEnvelope.parse(testEvent, TestSchema)
      ).toThrow();
    });
  });
  describe('safeParse', () => {
    it('should parse custom schema in envelope', () => {
      const testEvent =
        TestEvents.lambdaFunctionUrlEvent as APIGatewayProxyEventV2;
      const data = generateMock(TestSchema);

      testEvent.body = JSON.stringify(data);

      expect(
        LambdaFunctionUrlEnvelope.safeParse(testEvent, TestSchema)
      ).toEqual({
        success: true,
        data,
      });
    });

    it('should return original event when envelope is not valid', () => {
      expect(
        LambdaFunctionUrlEnvelope.safeParse({ foo: 'bar' }, TestSchema)
      ).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      });
    });

    it('should return original event when body does not match schema', () => {
      const testEvent =
        TestEvents.lambdaFunctionUrlEvent as APIGatewayProxyEventV2;
      testEvent.body = JSON.stringify({ foo: 'bar' });

      const parseResult = LambdaFunctionUrlEnvelope.safeParse(
        testEvent,
        TestSchema
      );
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: testEvent,
      });

      if (!parseResult.success && parseResult.error) {
        expect(parseResult.error.cause).toBeInstanceOf(ZodError);
      }
    });
  });
});
