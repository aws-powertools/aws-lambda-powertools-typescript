/**
 * Test processPartialResponse function
 *
 * @group unit/batch/function/processpartialresponse
 */
import type {
  Context,
  DynamoDBStreamEvent,
  KinesisStreamEvent,
  SQSEvent,
} from 'aws-lambda';
import { helloworldContext as dummyContext } from '@aws-lambda-powertools/commons/lib/samples/resources/contexts';
import { Custom as dummyEvent } from '@aws-lambda-powertools/commons/lib/samples/resources/events';
import { EventType } from '../../src/constants';
import type {
  BatchProcessingOptions,
  PartialItemFailureResponse,
} from '../../src/types';
import {
  dynamodbRecordFactory,
  kinesisRecordFactory,
  sqsRecordFactory,
} from '../helpers/factories';
import {
  asyncDynamodbRecordHandler,
  asyncHandlerWithContext,
  asyncKinesisRecordHandler,
  asyncSqsRecordHandler,
  dynamodbRecordHandler,
  handlerWithContext,
  kinesisRecordHandler,
  sqsRecordHandler,
} from '../helpers/handlers';
import { BatchProcessor } from '../../src/BatchProcessor';
import {
  processPartialResponse,
  processPartialResponseSync,
} from '../../src/processPartialResponse';

describe('Function: processPartialResponse()', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext;
  const options: BatchProcessingOptions = { context: dummyContext };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Process partial response function call tests', () => {
    test('Process partial response function call with synchronous handler', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const batch = { Records: records };
      const processor = new BatchProcessor(EventType.SQS);

      // Act
      const ret = processPartialResponseSync(
        batch,
        sqsRecordHandler,
        processor
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response function call with context provided', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const batch = { Records: records };
      const processor = new BatchProcessor(EventType.SQS);

      // Act
      const ret = processPartialResponseSync(
        batch,
        handlerWithContext,
        processor,
        options
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response function call with asynchronous handler', async () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const batch = { Records: records };
      const processor = new BatchProcessor(EventType.SQS);

      // Act
      const ret = await processPartialResponse(
        batch,
        asyncSqsRecordHandler,
        processor
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response function call with context provided', async () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const batch = { Records: records };
      const processor = new BatchProcessor(EventType.SQS);

      // Act
      const ret = await processPartialResponse(
        batch,
        asyncHandlerWithContext,
        processor,
        options
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });
  });

  describe('Process partial response function call through handler', () => {
    test('Process partial response through handler with SQS event', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(event, sqsRecordHandler, processor);
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with Kinesis event', () => {
      // Prepare
      const records = [
        kinesisRecordFactory('success'),
        kinesisRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.KinesisDataStreams);
      const event: KinesisStreamEvent = { Records: records };

      const handler = (
        event: KinesisStreamEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(
          event,
          kinesisRecordHandler,
          processor
        );
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with DynamoDB event', () => {
      // Prepare
      const records = [
        dynamodbRecordFactory('success'),
        dynamodbRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.DynamoDBStreams);
      const event: DynamoDBStreamEvent = { Records: records };

      const handler = (
        event: DynamoDBStreamEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(
          event,
          dynamodbRecordHandler,
          processor
        );
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler for SQS records with incorrect event type', () => {
      // Prepare
      const processor = new BatchProcessor(EventType.SQS);
      const event = dummyEvent;

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(event, sqsRecordHandler, processor);
      };

      // Act & Assess
      expect(() => handler(event as unknown as SQSEvent, context)).toThrowError(
        `Unexpected batch type. Possible values are: ${Object.keys(
          EventType
        ).join(', ')}`
      );
    });

    test('Process partial response through handler with context provided', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = (
        event: SQSEvent,
        context: Context
      ): PartialItemFailureResponse => {
        const options: BatchProcessingOptions = { context: context };

        return processPartialResponseSync(
          event,
          handlerWithContext,
          processor,
          options
        );
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with SQS event', async () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = async (
        event: SQSEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return processPartialResponse(event, asyncSqsRecordHandler, processor);
      };

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with Kinesis event', async () => {
      // Prepare
      const records = [
        kinesisRecordFactory('success'),
        kinesisRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.KinesisDataStreams);
      const event: KinesisStreamEvent = { Records: records };

      const handler = async (
        event: KinesisStreamEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return await processPartialResponse(
          event,
          asyncKinesisRecordHandler,
          processor
        );
      };

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with DynamoDB event', async () => {
      // Prepare
      const records = [
        dynamodbRecordFactory('success'),
        dynamodbRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.DynamoDBStreams);
      const event: DynamoDBStreamEvent = { Records: records };

      const handler = async (
        event: DynamoDBStreamEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return await processPartialResponse(
          event,
          asyncDynamodbRecordHandler,
          processor
        );
      };

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler for SQS records with incorrect event type', async () => {
      // Prepare
      const processor = new BatchProcessor(EventType.SQS);
      const event = dummyEvent;

      const handler = async (
        event: SQSEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return await processPartialResponse(
          event,
          asyncSqsRecordHandler,
          processor
        );
      };

      // Act & Assess
      await expect(() =>
        handler(event as unknown as SQSEvent, context)
      ).rejects.toThrowError(
        `Unexpected batch type. Possible values are: ${Object.keys(
          EventType
        ).join(', ')}`
      );
    });

    test('Process partial response through handler with context provided', async () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = async (
        event: SQSEvent,
        context: Context
      ): Promise<PartialItemFailureResponse> => {
        const options: BatchProcessingOptions = { context: context };

        return await processPartialResponse(
          event,
          asyncHandlerWithContext,
          processor,
          options
        );
      };

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });
  });
});
