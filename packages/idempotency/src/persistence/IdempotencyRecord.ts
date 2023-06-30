import type { IdempotencyRecordOptions } from '../types';
import { IdempotencyRecordStatus } from '../types';
import { IdempotencyInvalidStatusError } from '../errors';

/**
 * Class representing an idempotency record.
 * The properties of this class will be reflected in the persistence layer.
 */
class IdempotencyRecord {
  /**
   * The expiry timestamp of the record in milliseconds UTC.
   */
  public expiryTimestamp?: number;
  /**
   * The idempotency key of the record that is used to identify the record.
   */
  public idempotencyKey: string;
  /**
   * The expiry timestamp of the in progress record in milliseconds UTC.
   */
  public inProgressExpiryTimestamp?: number;
  /**
   * The hash of the payload of the request, used for comparing requests.
   */
  public payloadHash?: string;
  /**
   * The response data of the request, this will be returned if the payload hash matches.
   */
  public responseData?: Record<string, unknown>;
  /**
   * The idempotency record status can be COMPLETED, IN_PROGRESS or EXPIRED.
   * We check the status during idempotency processing to make sure we don't process an expired record and handle concurrent requests.
   * @link {IdempotencyRecordStatus}
   * @private
   */
  private status: IdempotencyRecordStatus;

  public constructor(config: IdempotencyRecordOptions) {
    this.idempotencyKey = config.idempotencyKey;
    this.expiryTimestamp = config.expiryTimestamp;
    this.inProgressExpiryTimestamp = config.inProgressExpiryTimestamp;
    this.responseData = config.responseData;
    this.payloadHash = config.payloadHash;
    this.status = config.status;
  }

  /**
   * Get the response data of the record.
   */
  public getResponse(): Record<string, unknown> | undefined {
    return this.responseData;
  }

  /**
   * Get the status of the record.
   * @throws {IdempotencyInvalidStatusError} If the status is not a valid status.
   */
  public getStatus(): IdempotencyRecordStatus {
    if (this.isExpired()) {
      return IdempotencyRecordStatus.EXPIRED;
    } else if (Object.values(IdempotencyRecordStatus).includes(this.status)) {
      return this.status;
    } else {
      throw new IdempotencyInvalidStatusError(this.status);
    }
  }

  /**
   * Returns true if the record is expired or undefined.
   */
  public isExpired(): boolean {
    return (
      this.expiryTimestamp !== undefined &&
      Date.now() / 1000 > this.expiryTimestamp
    );
  }
}

export { IdempotencyRecord };
