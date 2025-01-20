import { describe, expect, it } from 'vitest';
import { LambdaFunctionUrlSchema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('Lambda ', () => {
  it('should parse lambda event', () => {
    const lambdaFunctionUrlEvent = TestEvents.lambdaFunctionUrlEvent;

    expect(LambdaFunctionUrlSchema.parse(lambdaFunctionUrlEvent)).toEqual(
      lambdaFunctionUrlEvent
    );
  });

  it('should parse url IAM event', () => {
    const urlIAMEvent = TestEvents.lambdaFunctionUrlIAMEvent;

    expect(LambdaFunctionUrlSchema.parse(urlIAMEvent)).toEqual(urlIAMEvent);
  });
});
