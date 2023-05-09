/**
 * Test Function Wrapper
 *
 * @group unit/idempotency/decorator
 */

import { BasePersistenceLayer, IdempotencyRecord } from '../../src/persistence';
import { idempotent } from '../../src/idempotentDecorator';
import type { IdempotencyRecordOptions } from '../../src/types';
import { IdempotencyRecordStatus } from '../../src/types';
import {
  IdempotencyAlreadyInProgressError,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError
} from '../../src/Exceptions';

const mockSaveInProgress = jest.spyOn(BasePersistenceLayer.prototype, 'saveInProgress').mockImplementation();
const mockSaveSuccess = jest.spyOn(BasePersistenceLayer.prototype, 'saveSuccess').mockImplementation();
const mockGetRecord = jest.spyOn(BasePersistenceLayer.prototype, 'getRecord').mockImplementation();

class PersistenceLayerTestClass extends BasePersistenceLayer {
  protected _deleteRecord = jest.fn();
  protected _getRecord = jest.fn();
  protected _putRecord = jest.fn();
  protected _updateRecord = jest.fn();
}

const functionalityToDecorate = jest.fn();

class TestingClass {
  @idempotent({ persistenceStore: new PersistenceLayerTestClass(), dataKeywordArgument: 'testingKey' })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public testing(record: Record<string, unknown>): string {
    functionalityToDecorate(record);

    return 'Hi';
  }
}

class TestingClassWithoutKeywordArgument {
  @idempotent({ persistenceStore: new PersistenceLayerTestClass() })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public testing(record: Record<string, unknown>): string {
    functionalityToDecorate(record);

    return 'Hi';
  }
}

describe('Given a class with a function to decorate', (classWithFunction = new TestingClass(),
  classWithFunctionNoKeywordArg = new TestingClassWithoutKeywordArgument()) => {
  const keyValueToBeSaved = 'thisWillBeSaved';
  const inputRecord = { testingKey: keyValueToBeSaved, otherKey: 'thisWillNot' };
  beforeEach(() => jest.clearAllMocks());

  describe('When wrapping a function with no previous executions', () => {
    beforeEach(async () => {
      await classWithFunctionNoKeywordArg.testing(inputRecord);
    });

    test('Then it will save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(inputRecord);
    });

    test('Then it will call the function that was decorated', () => {
      expect(functionalityToDecorate).toBeCalledWith(inputRecord);
    });

    test('Then it will save the record to COMPLETED with function return value', () => {
      expect(mockSaveSuccess).toBeCalledWith(inputRecord, 'Hi');
    });

  });
  describe('When wrapping a function with no previous executions', () => {
    beforeEach(async () => {
      await classWithFunction.testing(inputRecord);
    });

    test('Then it will save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
    });

    test('Then it will call the function that was decorated', () => {
      expect(functionalityToDecorate).toBeCalledWith(inputRecord);
    });

    test('Then it will save the record to COMPLETED with function return value', () => {
      expect(mockSaveSuccess).toBeCalledWith(keyValueToBeSaved, 'Hi');
    });
  });

  describe('When decorating a function with previous execution that is INPROGRESS', () => {
    let resultingError: Error;
    beforeEach(async () => {
      mockSaveInProgress.mockRejectedValue(new IdempotencyItemAlreadyExistsError());
      const idempotencyOptions: IdempotencyRecordOptions = {
        idempotencyKey: 'key',
        status: IdempotencyRecordStatus.INPROGRESS
      };
      mockGetRecord.mockResolvedValue(new IdempotencyRecord(idempotencyOptions));
      try {
        await classWithFunction.testing(inputRecord);
      } catch (e) {
        resultingError = e as Error;
      }
    });

    test('Then it will attempt to save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
    });

    test('Then it will get the previous execution record', () => {
      expect(mockGetRecord).toBeCalledWith(keyValueToBeSaved);
    });

    test('Then it will not call the function that was decorated', () => {
      expect(functionalityToDecorate).not.toBeCalled();
    });

    test('Then an IdempotencyAlreadyInProgressError is thrown', () => {
      expect(resultingError).toBeInstanceOf(IdempotencyAlreadyInProgressError);
    });
  });

  describe('When decorating a function with previous execution that is EXPIRED', () => {
    let resultingError: Error;
    beforeEach(async () => {
      mockSaveInProgress.mockRejectedValue(new IdempotencyItemAlreadyExistsError());
      const idempotencyOptions: IdempotencyRecordOptions = {
        idempotencyKey: 'key',
        status: IdempotencyRecordStatus.EXPIRED
      };
      mockGetRecord.mockResolvedValue(new IdempotencyRecord(idempotencyOptions));
      try {
        await classWithFunction.testing(inputRecord);
      } catch (e) {
        resultingError = e as Error;
      }
    });

    test('Then it will attempt to save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
    });

    test('Then it will get the previous execution record', () => {
      expect(mockGetRecord).toBeCalledWith(keyValueToBeSaved);
    });

    test('Then it will not call the function that was decorated', () => {
      expect(functionalityToDecorate).not.toBeCalled();
    });

    test('Then an IdempotencyInconsistentStateError is thrown', () => {
      expect(resultingError).toBeInstanceOf(IdempotencyInconsistentStateError);
    });
  });

  describe('When wrapping a function with previous execution that is COMPLETED', () => {
    beforeEach(async () => {
      mockSaveInProgress.mockRejectedValue(new IdempotencyItemAlreadyExistsError());
      const idempotencyOptions: IdempotencyRecordOptions = {
        idempotencyKey: 'key',
        status: IdempotencyRecordStatus.COMPLETED,
      };

      mockGetRecord.mockResolvedValue(new IdempotencyRecord(idempotencyOptions));
      await classWithFunction.testing(inputRecord);
    });

    test('Then it will attempt to save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
    });

    test('Then it will get the previous execution record', () => {
      expect(mockGetRecord).toBeCalledWith(keyValueToBeSaved);
    });

    test('Then it will not call decorated functionality', () => {
      expect(functionalityToDecorate).not.toBeCalledWith(inputRecord);
    });

  });

  describe('When wrapping a function with issues saving the record', () => {
    let resultingError: Error;
    beforeEach(async () => {
      mockSaveInProgress.mockRejectedValue(new Error('RandomError'));
      try {
        await classWithFunction.testing(inputRecord);
      } catch (e) {
        resultingError = e as Error;
      }
    });

    test('Then it will attempt to save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
    });

    test('Then an IdempotencyPersistenceLayerError is thrown', () => {
      expect(resultingError).toBeInstanceOf(IdempotencyPersistenceLayerError);
    });
  });

});

