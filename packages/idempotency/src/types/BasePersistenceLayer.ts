import { IdempotencyRecord } from '../persistence/IdempotencyRecord.js';
import { IdempotencyConfig } from '../IdempotencyConfig.js';

type BasePersistenceLayerOptions = {
  config: IdempotencyConfig;
  functionName?: string;
};

interface BasePersistenceLayerInterface {
  configure(options?: BasePersistenceLayerOptions): void;
  isPayloadValidationEnabled(): boolean;
  saveInProgress(data: unknown, remainingTimeInMillis?: number): Promise<void>;
  saveSuccess(data: unknown, result: unknown): Promise<void>;
  deleteRecord(data: unknown): Promise<void>;
  getRecord(data: unknown): Promise<IdempotencyRecord>;
}

export { BasePersistenceLayerOptions, BasePersistenceLayerInterface };
