import {
  BatchProcessorSync,
  EventType,
  processPartialResponseSync,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  SQSEvent,
  SQSRecord,
  Context,
  SQSBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessorSync(EventType.SQS); // (1)!
const logger = new Logger();

// prettier-ignore
const recordHandler = (record: SQSRecord): void => { // (2)!
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  }
};

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  // prettier-ignore
  return processPartialResponseSync(event, recordHandler, processor, { // (3)!
    context,
  });
};
export { processor };
