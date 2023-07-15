/**
 * Process batch and partially report failed items
 */
import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';
import {
  BasePartialProcessor,
  BatchProcessingError,
  DATA_CLASS_MAPPING,
  DEFAULT_RESPONSE,
  EventSourceDataClassTypes,
  EventType,
  ItemIdentifier,
  BatchResponse,
} from '.';

abstract class BasePartialBatchProcessor extends BasePartialProcessor {
  public COLLECTOR_MAPPING;

  public batchResponse: BatchResponse;

  public eventType: keyof typeof EventType;

  /**
   * Initializes base batch processing class
   * @param eventType Whether this is SQS, DynamoDB stream, or Kinesis data stream event
   */
  public constructor(eventType: keyof typeof EventType) {
    super();
    this.eventType = eventType;
    this.batchResponse = DEFAULT_RESPONSE;
    this.COLLECTOR_MAPPING = {
      [EventType.SQS]: () => this.collectSqsFailures(),
      [EventType.KinesisDataStreams]: () => this.collectKinesisFailures(),
      [EventType.DynamoDBStreams]: () => this.collectDynamoDBFailures(),
    };
  }

  /**
   * Report messages to be deleted in case of partial failures
   */
  public clean(): void {
    if (!this.hasMessagesToReport()) {
      return;
    }

    if (this.entireBatchFailed()) {
      throw new BatchProcessingError(
        'All records failed processing. ' +
          this.exceptions.length +
          ' individual errors logged separately below.',
        this.exceptions
      );
    }

    const messages: ItemIdentifier[] = this.getMessagesToReport();
    this.batchResponse = { batchItemFailures: messages };
  }

  /**
   * Collects identifiers of failed items for a DynamoDB stream
   * @returns list of identifiers for failed items
   */
  public collectDynamoDBFailures(): ItemIdentifier[] {
    const failures: ItemIdentifier[] = [];

    for (const msg of this.failureMessages) {
      const msgId = (msg as DynamoDBRecord).dynamodb?.SequenceNumber;
      if (msgId) {
        failures.push({ itemIdentifier: msgId });
      }
    }

    return failures;
  }

  /**
   * Collects identifiers of failed items for a Kinesis stream
   * @returns list of identifiers for failed items
   */
  public collectKinesisFailures(): ItemIdentifier[] {
    const failures: ItemIdentifier[] = [];

    for (const msg of this.failureMessages) {
      const msgId = (msg as KinesisStreamRecord).kinesis.sequenceNumber;
      failures.push({ itemIdentifier: msgId });
    }

    return failures;
  }

  /**
   * Collects identifiers of failed items for an SQS batch
   * @returns list of identifiers for failed items
   */
  public collectSqsFailures(): ItemIdentifier[] {
    const failures: ItemIdentifier[] = [];

    for (const msg of this.failureMessages) {
      const msgId = (msg as SQSRecord).messageId;
      failures.push({ itemIdentifier: msgId });
    }

    return failures;
  }

  /**
   * Determines whether all records in a batch failed to process
   * @returns true if all records resulted in exception results
   */
  public entireBatchFailed(): boolean {
    return this.exceptions.length == this.records.length;
  }

  /**
   * Collects identifiers for failed batch items
   * @returns formatted messages to use in batch deletion
   */
  public getMessagesToReport(): ItemIdentifier[] {
    return this.COLLECTOR_MAPPING[this.eventType]();
  }

  /**
   * Determines if any records failed to process
   * @returns true if any records resulted in exception
   */
  public hasMessagesToReport(): boolean {
    if (this.failureMessages.length != 0) {
      return true;
    }

    // console.debug('All ' + this.successMessages.length + ' records successfully processed');

    return false;
  }

  /**
   * Remove results from previous execution
   */
  public prepare(): void {
    this.successMessages.length = 0;
    this.failureMessages.length = 0;
    this.exceptions.length = 0;
    this.batchResponse = DEFAULT_RESPONSE;
  }

  /**
   * @returns Batch items that failed processing, if any
   */
  public response(): BatchResponse {
    return this.batchResponse;
  }

  public toBatchType(
    record: EventSourceDataClassTypes,
    eventType: keyof typeof EventType
  ): SQSRecord | KinesisStreamRecord | DynamoDBRecord {
    return DATA_CLASS_MAPPING[eventType](record);
  }
}

export { BasePartialBatchProcessor };
