import { logMetrics } from '../../../../metrics/src/middleware';
import { Metrics, MetricUnits } from '../../../../metrics/src';
import middy from '@middy/core';
import { ExtraOptions } from '../../../src/types';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

describe('Middy middleware', () => {

  beforeEach(() => {
    jest.resetModules();
    consoleSpy.mockClear();
    dateSpy.mockClear();
  });

  describe('logMetrics', () => {

    test('when a metrics instance is passed WITH custom options, it prints the metrics in the stdout', async () => {

      // Prepare
      const metrics = new Metrics({ namespace:'ServerlessAirline', service:'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('SuccessfulBooking', MetricUnits.Count, 1);
        metrics.addMetric('SuccessfulBooking', MetricUnits.Count, 1);
      };
      const metricsOptions: ExtraOptions = {
        raiseOnEmptyMetrics: true,
        defaultDimensions: { environment : 'prod', aws_region: 'eu-central-1' },
        captureColdStartMetric: true
      };
      const handler = middy(lambdaHandler).use(logMetrics(metrics, metricsOptions));
      const event = { foo: 'bar' };
      const getRandomInt = (): number => Math.floor(Math.random() * 1000000000);

      const awsRequestId = getRandomInt().toString();
      const context = {
        callbackWaitsForEmptyEventLoop: true,
        functionVersion: '$LATEST',
        functionName: 'foo-bar-function',
        memoryLimitInMB: '128',
        logGroupName: '/aws/lambda/foo-bar-function',
        logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
        invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:foo-bar-function',
        awsRequestId: awsRequestId,
        getRemainingTimeInMillis: () => 1234,
        done: () => console.log('Done!'),
        fail: () => console.log('Failed!'),
        succeed: () => console.log('Succeeded!'),
      };

      // Act
      await handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(1, JSON.stringify({
        '_aws': {
          'Timestamp': 1466424490000,
          'CloudWatchMetrics': [{
            'Namespace': 'ServerlessAirline',
            'Dimensions': [
              [ 'environment', 'aws_region', 'service', 'function_name' ]
            ],
            'Metrics': [{ 'Name': 'ColdStart', 'Unit': 'Count' }],
          }],
        },
        'environment': 'prod',
        'aws_region' : 'eu-central-1',
        'service': 'orders',
        'function_name': 'foo-bar-function',
        'ColdStart': 1,
      }));
      expect(console.log).toHaveBeenNthCalledWith(2, JSON.stringify({
        '_aws': {
          'Timestamp': 1466424490000,
          'CloudWatchMetrics': [{
            'Namespace': 'ServerlessAirline',
            'Dimensions': [
              [ 'environment', 'aws_region', 'service' ]
            ],
            'Metrics': [{ 'Name': 'SuccessfulBooking', 'Unit': 'Count' }],
          }],
        },
        'environment': 'prod',
        'aws_region' : 'eu-central-1',
        'service': 'orders',
        'SuccessfulBooking': 1,
      }));

    });

    test('when a metrics instance is passed WITHOUT custom options, it prints the metrics in the stdout', async () => {

      // Prepare
      const metrics = new Metrics({ namespace:'ServerlessAirline', service:'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('SuccessfulBooking', MetricUnits.Count, 1);
        metrics.addMetric('SuccessfulBooking', MetricUnits.Count, 1);
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));
      const event = { foo: 'bar' };
      const getRandomInt = (): number => Math.floor(Math.random() * 1000000000);

      const awsRequestId = getRandomInt().toString();
      const context = {
        callbackWaitsForEmptyEventLoop: true,
        functionVersion: '$LATEST',
        functionName: 'foo-bar-function',
        memoryLimitInMB: '128',
        logGroupName: '/aws/lambda/foo-bar-function',
        logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
        invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:foo-bar-function',
        awsRequestId: awsRequestId,
        getRemainingTimeInMillis: () => 1234,
        done: () => console.log('Done!'),
        fail: () => console.log('Failed!'),
        succeed: () => console.log('Succeeded!'),
      };

      // Act
      await handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(1, JSON.stringify({
        '_aws': {
          'Timestamp': 1466424490000,
          'CloudWatchMetrics': [{
            'Namespace': 'ServerlessAirline',
            'Dimensions': [
              ['service']
            ],
            'Metrics': [{ 'Name': 'SuccessfulBooking', 'Unit': 'Count' }],
          }],
        },
        'service': 'orders',
        'SuccessfulBooking': 1,
      }));

    });

  });

});