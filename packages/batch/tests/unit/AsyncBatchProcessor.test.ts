/**
 * Test AsyncAsyncBatchProcessor class
 *
 * @group unit/batch/class/asyncAsyncBatchProcessor
 */
import { AsyncBatchProcessor } from '../../src/AsyncBatchProcessor';
import { EventType } from '../../src/constants';
import { BatchProcessingError } from '../../src/errors';
import {
  dynamodbRecordFactory,
  kinesisRecordFactory,
  sqsRecordFactory,
} from '../helpers/factories';
import {
  asyncDynamodbRecordHandler,
  asyncKinesisRecordHandler,
  asyncSqsRecordHandler,
} from '../helpers/handlers';

describe('Class: AsyncAsyncBatchProcessor', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Asynchronously processing SQS Records', () => {
    test('Batch processing SQS records with no failures', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('success');
      const records = [firstRecord, secondRecord];
      const processor = new AsyncBatchProcessor(EventType.SQS);

      // Act
      processor.register(records, asyncSqsRecordHandler);
      const processedMessages = await processor.processAsync();

      // Assess
      expect(processedMessages).toStrictEqual([
        ['success', firstRecord.body, firstRecord],
        ['success', secondRecord.body, secondRecord],
      ]);
    });

    test('Batch processing SQS records with some failures', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('failure');
      const secondRecord = sqsRecordFactory('success');
      const thirdRecord = sqsRecordFactory('fail');
      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new AsyncBatchProcessor(EventType.SQS);

      // Act
      processor.register(records, asyncSqsRecordHandler);
      const processedMessages = await processor.processAsync();

      // Assess
      expect(processedMessages[1]).toStrictEqual([
        'success',
        secondRecord.body,
        secondRecord,
      ]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual({
        batchItemFailures: [
          { itemIdentifier: firstRecord.messageId },
          { itemIdentifier: thirdRecord.messageId },
        ],
      });
    });

    test('Batch processing SQS records with all failures', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('failure');
      const secondRecord = sqsRecordFactory('failure');
      const thirdRecord = sqsRecordFactory('fail');

      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new AsyncBatchProcessor(EventType.SQS);

      // Act
      processor.register(records, asyncSqsRecordHandler);

      // Assess
      await expect(processor.processAsync()).rejects.toThrowError(
        BatchProcessingError
      );
    });
  });

  describe('Asynchronously processing Kinesis Records', () => {
    test('Batch processing Kinesis records with no failures', async () => {
      // Prepare
      const firstRecord = kinesisRecordFactory('success');
      const secondRecord = kinesisRecordFactory('success');
      const records = [firstRecord, secondRecord];
      const processor = new AsyncBatchProcessor(EventType.KinesisDataStreams);

      // Act
      processor.register(records, asyncKinesisRecordHandler);
      const processedMessages = await processor.processAsync();

      // Assess
      expect(processedMessages).toStrictEqual([
        ['success', firstRecord.kinesis.data, firstRecord],
        ['success', secondRecord.kinesis.data, secondRecord],
      ]);
    });

    test('Batch processing Kinesis records with some failures', async () => {
      // Prepare
      const firstRecord = kinesisRecordFactory('failure');
      const secondRecord = kinesisRecordFactory('success');
      const thirdRecord = kinesisRecordFactory('fail');
      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new AsyncBatchProcessor(EventType.KinesisDataStreams);

      // Act
      processor.register(records, asyncKinesisRecordHandler);
      const processedMessages = await processor.processAsync();

      // Assess
      expect(processedMessages[1]).toStrictEqual([
        'success',
        secondRecord.kinesis.data,
        secondRecord,
      ]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual({
        batchItemFailures: [
          { itemIdentifier: firstRecord.kinesis.sequenceNumber },
          { itemIdentifier: thirdRecord.kinesis.sequenceNumber },
        ],
      });
    });

    test('Batch processing Kinesis records with all failures', async () => {
      // Prepare
      const firstRecord = kinesisRecordFactory('failure');
      const secondRecord = kinesisRecordFactory('failure');
      const thirdRecord = kinesisRecordFactory('fail');

      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new AsyncBatchProcessor(EventType.KinesisDataStreams);

      // Act
      processor.register(records, asyncKinesisRecordHandler);

      // Assess
      await expect(processor.processAsync()).rejects.toThrowError(
        BatchProcessingError
      );
    });
  });

  describe('Asynchronously processing DynamoDB Records', () => {
    test('Batch processing DynamoDB records with no failures', async () => {
      // Prepare
      const firstRecord = dynamodbRecordFactory('success');
      const secondRecord = dynamodbRecordFactory('success');
      const records = [firstRecord, secondRecord];
      const processor = new AsyncBatchProcessor(EventType.DynamoDBStreams);

      // Act
      processor.register(records, asyncDynamodbRecordHandler);
      const processedMessages = await processor.processAsync();

      // Assess
      expect(processedMessages).toStrictEqual([
        ['success', firstRecord.dynamodb?.NewImage?.Message, firstRecord],
        ['success', secondRecord.dynamodb?.NewImage?.Message, secondRecord],
      ]);
    });

    test('Batch processing DynamoDB records with some failures', async () => {
      // Prepare
      const firstRecord = dynamodbRecordFactory('failure');
      const secondRecord = dynamodbRecordFactory('success');
      const thirdRecord = dynamodbRecordFactory('fail');
      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new AsyncBatchProcessor(EventType.DynamoDBStreams);

      // Act
      processor.register(records, asyncDynamodbRecordHandler);
      const processedMessages = await processor.processAsync();

      // Assess
      expect(processedMessages[1]).toStrictEqual([
        'success',
        secondRecord.dynamodb?.NewImage?.Message,
        secondRecord,
      ]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual({
        batchItemFailures: [
          { itemIdentifier: firstRecord.dynamodb?.SequenceNumber },
          { itemIdentifier: thirdRecord.dynamodb?.SequenceNumber },
        ],
      });
    });

    test('Batch processing DynamoDB records with all failures', async () => {
      // Prepare
      const firstRecord = dynamodbRecordFactory('failure');
      const secondRecord = dynamodbRecordFactory('failure');
      const thirdRecord = dynamodbRecordFactory('fail');

      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new AsyncBatchProcessor(EventType.DynamoDBStreams);

      // Act
      processor.register(records, asyncDynamodbRecordHandler);

      // Assess
      await expect(processor.processAsync()).rejects.toThrowError(
        BatchProcessingError
      );
    });
  });

  test('When calling the sync process method, it should throw an error', () => {
    // Prepare
    const processor = new AsyncBatchProcessor(EventType.SQS);

    // Act & Assess
    expect(() => processor.process()).toThrowError(
      'Not implemented. Use processAsync() instead.'
    );
  });
});
