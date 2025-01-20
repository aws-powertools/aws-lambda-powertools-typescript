import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const TestSchema = z.object({
  name: z.string(),
  age: z.number().min(18).max(99),
});

const filenames = [
  'activeMQEvent',
  'albEvent',
  'albEventPathTrailingSlash',
  'albMultiValueHeadersEvent',
  'awsConfigRuleConfigurationChanged',
  'awsConfigRuleOversizedConfiguration',
  'awsConfigRuleScheduled',
  'bedrockAgentEvent',
  'bedrockAgentPostEvent',
  'cloudFormationCustomResourceCreateEvent',
  'cloudFormationCustomResourceDeleteEvent',
  'cloudFormationCustomResourceUpdateEvent',
  'cloudWatchDashboardEvent',
  'cloudWatchLogEvent',
  'codePipelineEvent',
  'codePipelineEventData',
  'codePipelineEventEmptyUserParameters',
  'codePipelineEventWithEncryptionKey',
  'cognitoCreateAuthChallengeEvent',
  'cognitoCustomMessageEvent',
  'cognitoDefineAuthChallengeEvent',
  'cognitoPostAuthenticationEvent',
  'cognitoPostConfirmationEvent',
  'cognitoPreAuthenticationEvent',
  'cognitoPreSignUpEvent',
  'cognitoPreTokenGenerationEvent',
  'cognitoUserMigrationEvent',
  'cognitoVerifyAuthChallengeResponseEvent',
  'connectContactFlowEventAll',
  'connectContactFlowEventMin',
  'kinesisFirehoseKinesisEvent',
  'kinesisFirehosePutEvent',
  'kinesisFirehoseSQSEvent',
  'kinesisStreamCloudWatchLogsEvent',
  'kinesisStreamEvent',
  'kinesisStreamEventOneRecord',
  'lambdaFunctionUrlEvent',
  'lambdaFunctionUrlEventPathTrailingSlash',
  'lambdaFunctionUrlIAMEvent',
  'rabbitMQEvent',
  's3Event',
  's3EventBridgeNotificationObjectCreatedEvent',
  's3EventBridgeNotificationObjectDeletedEvent',
  's3EventBridgeNotificationObjectExpiredEvent',
  's3EventBridgeNotificationObjectRestoreCompletedEvent',
  's3EventDecodedKey',
  's3EventDeleteObject',
  's3EventDeleteObjectWithoutEtagSize',
  's3EventGlacier',
  's3ObjectEventIAMUser',
  's3ObjectEventTempCredentials',
  's3SqsEvent',
  'secretsManagerEvent',
  'sesEvent',
  'snsEvent',
  'snsSqsEvent',
  'snsSqsFifoEvent',
  'sqsEvent',
  'vpcLatticeEvent',
  'vpcLatticeEventPathTrailingSlash',
  'vpcLatticeEventV2PathTrailingSlash',
  'vpcLatticeV2Event',
] as const;

type TestEvents = { [K in (typeof filenames)[number]]: unknown };
const loadFileContent = (filename: string): string =>
  readFileSync(
    join(__dirname, '..', '..', 'events', `${filename}.json`),
    'utf-8'
  );

const createTestEvents = (fileList: readonly string[]): TestEvents => {
  const testEvents: Partial<TestEvents> = {};

  for (const filename of fileList) {
    Object.defineProperty(testEvents, filename, {
      get: () => JSON.parse(loadFileContent(filename)),
    });
  }

  return testEvents as TestEvents;
};

export const TestEvents = createTestEvents(filenames);

/**
 * Reads and parses a JSON file from the specified events path and filename, returning the parsed object.
 *
 * @template T - The expected type of the parsed JSON object.
 * @param {Object} params - The parameters for the function.
 * @param {string} params.eventsPath - The relative path to the directory containing the event files.
 * @param {string} params.filename - The name of the JSON file (without extension) to be read and parsed.
 */
export const getTestEvent = <T extends Record<string, unknown>>({
  eventsPath,
  filename,
}: {
  eventsPath: string;
  filename: string;
}): T =>
  JSON.parse(
    readFileSync(
      join(__dirname, '..', '..', 'events', eventsPath, `${filename}.json`),
      'utf-8'
    )
  ) as T;

export function omit<T extends Record<string, unknown>, Keys extends keyof T>(
  keys: readonly Keys[],
  obj: T
): Omit<T, Keys> {
  const result = { ...obj };

  for (const key of keys) {
    delete result[key];
  }

  return result;
}
