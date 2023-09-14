import {
  BatchProcessorSync,
  EventType,
  processPartialResponseSync,
} from '@aws-lambda-powertools/batch';
import type {
  Context,
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
} from 'aws-lambda';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';

const processor = new BatchProcessorSync(EventType.SQS);

const dynamoDBPersistence = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTable',
});
const idempotencyConfig = new IdempotencyConfig({
  eventKeyJmesPath: 'messageId',
});

const processIdempotently = makeIdempotent(
  async (_record: SQSRecord) => {
    // process your event
  },
  {
    persistenceStore: dynamoDBPersistence,
    config: idempotencyConfig,
  }
);

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  idempotencyConfig.registerLambdaContext(context);

  return processPartialResponseSync(event, processIdempotently, processor, {
    context,
  });
};
