import type { SQSRecord } from 'aws-lambda';
import { BatchProcessor } from './BatchProcessor.js';
import { SqsFifo } from './SqsFifo.js';
import { EventType } from './constants.js';
import { SqsFifoMessageGroupShortCircuitError } from './errors.js';
import type { FailureResponse, SuccessResponse } from './types.js';

/**
 * Batch processor for SQS FIFO queues
 *
 * This class extends the {@link BatchProcessor} class and provides
 * a mechanism to process records from SQS FIFO queues asynchronously.
 *
 * By default, we will stop processing at the first failure and mark unprocessed messages as failed to preserve ordering.
 *
 * However, this behavior may not be optimal for customers who wish to proceed with processing messages from a different group ID.
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   SqsFifoPartialProcessorAsync,
 *   processPartialResponse,
 * } from '@aws-lambda-powertools/batch';
 * import type { SQSRecord, SQSHandler } from 'aws-lambda';
 *
 * const processor = new SqsFifoPartialProcessorAsync();
 *
 * const recordHandler = async (record: SQSRecord): Promise<void> => {
 *   const payload = JSON.parse(record.body);
 * };
 *
 * export const handler: SQSHandler = async (event, context) =>
 *   processPartialResponse(event, recordHandler, processor, {
 *     context,
 *   });
 * ```
 */
class SqsFifoPartialProcessorAsync extends SqsFifo(BatchProcessor) {
  public constructor() {
    super(EventType.SQS);
  }
  /**
   * Process a record with a asynchronous handler
   *
   * This method orchestrates the processing of a batch of records asynchronously
   * for SQS FIFO queues.
   *
   * The method calls the prepare hook to initialize the processor and then
   * iterates over each record in the batch, processing them one by one.
   *
   * If one of them fails and `skipGroupOnError` is not true, the method short circuits
   * the processing and fails the remaining records in the batch.
   *
   * If one of them fails and `skipGroupOnError` is true, then the method fails the current record
   * if the message group has any previous failure, otherwise keeps processing.
   *
   * Then, it calls the clean hook to clean up the processor and returns the
   * processed records.
   */
  public async process(): Promise<(SuccessResponse | FailureResponse)[]> {
    this.prepare();

    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    let currentIndex = 0;
    for (const record of this.records) {
      this._setCurrentGroup((record as SQSRecord).attributes?.MessageGroupId);

      // If we have any failed messages, we should then short circuit the process and
      // fail remaining messages unless `skipGroupOnError` is true
      const shouldShortCircuit =
        !this.options?.skipGroupOnError && this.failureMessages.length !== 0;
      if (shouldShortCircuit) {
        return this._shortCircuitProcessing(currentIndex, processedRecords);
      }

      // If `skipGroupOnError` is true and the current group has previously failed,
      // then we should skip processing the current group.
      const shouldSkipCurrentGroup =
        this.options?.skipGroupOnError &&
        this._currentGroupId &&
        this._failedGroupIds.has(this._currentGroupId);

      const result = shouldSkipCurrentGroup
        ? this._processFailRecord(
            record,
            new SqsFifoMessageGroupShortCircuitError()
          )
        : await this.processRecord(record);

      processedRecords.push(result);
      currentIndex++;
    }

    this.clean();

    return processedRecords;
  }
}

export { SqsFifoPartialProcessorAsync };
