import {
  BatchProcessorSync,
  EventType,
  processPartialResponseSync,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  KinesisStreamEvent,
  KinesisStreamRecord,
  Context,
  KinesisStreamBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessorSync(EventType.KinesisDataStreams); // (1)!
const logger = new Logger();

const recordHandler = (record: KinesisStreamRecord): void => {
  logger.info('Processing record', { record: record.kinesis.data });
  const payload = JSON.parse(record.kinesis.data);
  logger.info('Processed item', { item: payload });
};

export const handler = async (
  event: KinesisStreamEvent,
  context: Context
): Promise<KinesisStreamBatchResponse> => {
  return processPartialResponseSync(event, recordHandler, processor, {
    context,
  });
};
