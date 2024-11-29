import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { handler, processor } from './gettingStartedSQS.js';

const context = {
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: '$LATEST',
  functionName: 'foo-bar-function',
  memoryLimitInMB: '128',
  logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
  logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
  invokedFunctionArn:
    'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
  awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  getRemainingTimeInMillis: () => 1234,
  done: () => console.log('Done!'),
  fail: () => console.log('Failed!'),
  succeed: () => console.log('Succeeded!'),
};

describe('Function tests', () => {
  it('returns one failed message', async () => {
    // Prepare
    const event = JSON.parse(
      readFileSync('./samples/sampleSQSEvent.json', 'utf8')
    );
    const processorResult = processor; // access processor for additional assertions
    const successfulRecord = event.Records[0];
    const failedRecord = event.Records[1];
    const expectedResponse = {
      batchItemFailures: [
        {
          itemIdentifier: failedRecord.messageId,
        },
      ],
    };

    // Act
    const response = await handler(event, context, () => {});

    // Assess
    expect(response).toEqual(expectedResponse);
    expect(processorResult.failureMessages).toHaveLength(1);
    expect(processorResult.successMessages[0]).toEqual(successfulRecord);
  });
});
