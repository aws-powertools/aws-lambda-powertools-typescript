/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { SqsRecordSchema, SqsSchema } from '../../../src/schemas/';
import type { SqsEvent } from '../../../src/types';
import type { SqsRecord } from '../../../src/types/schema';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

describe('SQS', () => {
  it('should parse sqs event', () => {
    const sqsEvent = TestEvents.sqsEvent;
    expect(SqsSchema.parse(sqsEvent)).toEqual(sqsEvent);
  });
  it('should parse record from sqs event', () => {
    const sqsEvent: SqsEvent = TestEvents.sqsEvent as SqsEvent;
    const parsed: SqsRecord = SqsRecordSchema.parse(sqsEvent.Records[0]);
    expect(parsed.body).toEqual('Test message.');
  });

  it('should detect missing properties in schema for sqs event', () => {
    const sqsEvent = TestEvents.sqsEvent;
    const strictSchema = makeSchemaStrictForTesting(SqsSchema);
    expect(() => strictSchema.parse(sqsEvent)).not.toThrow();
  });
});
