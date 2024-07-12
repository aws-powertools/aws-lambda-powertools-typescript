import { Logger } from '@aws-lambda-powertools/logger';
import type { CustomReplacerFn } from '@aws-lambda-powertools/logger/types';

const jsonReplacerFn: CustomReplacerFn = (_: string, value: unknown) =>
  value instanceof Set ? [...value] : value;

const logger = new Logger({ serviceName: 'serverlessAirline', jsonReplacerFn });

export const handler = async (): Promise<void> => {
  logger.info('Serialize with custom serializer', {
    serializedValue: new Set([1, 2, 3]),
  });
};
