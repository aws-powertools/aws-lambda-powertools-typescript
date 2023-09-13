import type { JSONValue } from '@aws-lambda-powertools/commons';
import { IdempotencyRecordStatus } from '../constants';

type IdempotencyRecordStatusValue =
  (typeof IdempotencyRecordStatus)[keyof typeof IdempotencyRecordStatus];

type IdempotencyRecordOptions = {
  idempotencyKey: string;
  status: IdempotencyRecordStatusValue;
  expiryTimestamp?: number;
  inProgressExpiryTimestamp?: number;
  responseData?: JSONValue;
  payloadHash?: string;
};

export { IdempotencyRecordStatusValue, IdempotencyRecordOptions };
