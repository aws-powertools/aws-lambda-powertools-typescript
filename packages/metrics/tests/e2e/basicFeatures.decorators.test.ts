/**
 * Test metrics standard functions
 *
 * @group e2e/metrics/decorator
 */
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  invokeFunction,
  isValidRuntimeKey,
  TestNodejsFunction,
  TestStack,
  TEST_RUNTIMES,
} from '@aws-lambda-powertools/testing-utils';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { getMetrics } from '../helpers/metricsUtils';
import {
  commonEnvironmentVariables,
  expectedDefaultDimensions,
  expectedExtraDimension,
  expectedMetricName,
  expectedMetricValue,
  ONE_MINUTE,
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

describe(`Metrics E2E tests, basic features decorator usage`, () => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  const testName = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'BasicFeatures-Decorator',
  });
  const testStack = new TestStack(testName);
  const startTime = new Date();

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'basicFeatures.decorator.test.functionCode.ts'
  );

  const fnNameBasicFeatures = concatenateResourceName({
    testName,
    resourceName: 'BasicFeatures',
  });

  const cloudwatchClient = new CloudWatchClient({});

  const invocations = 2;

  // Parameters to be used by Metrics in the Lambda function
  const expectedNamespace = randomUUID(); // to easily find metrics back at assert phase
  const expectedServiceName = fnNameBasicFeatures;

  beforeAll(async () => {
    // Prepare
    new TestNodejsFunction(testStack.stack, fnNameBasicFeatures, {
      functionName: fnNameBasicFeatures,
      entry: lambdaFunctionCodeFile,
      runtime: TEST_RUNTIMES[runtime],
      environment: {
        POWERTOOLS_SERVICE_NAME: 'metrics-e2e-testing',
        EXPECTED_NAMESPACE: expectedNamespace,
        EXPECTED_SERVICE_NAME: expectedServiceName,
        ...commonEnvironmentVariables,
      },
    });

    await testStack.deploy();

    // Act
    await invokeFunction({
      functionName: fnNameBasicFeatures,
      times: invocations,
      invocationMode: 'SEQUENTIAL',
    });
  }, SETUP_TIMEOUT);

  describe('ColdStart metrics', () => {
    it(
      'should capture ColdStart Metric',
      async () => {
        const expectedDimensions = [
          { Name: 'service', Value: expectedServiceName },
          { Name: 'function_name', Value: fnNameBasicFeatures },
          {
            Name: Object.keys(expectedDefaultDimensions)[0],
            Value: expectedDefaultDimensions.MyDimension,
          },
        ];
        // Check coldstart metric dimensions
        const coldStartMetrics = await getMetrics(
          cloudwatchClient,
          expectedNamespace,
          'ColdStart',
          1
        );

        expect(coldStartMetrics.Metrics?.length).toBe(1);
        const coldStartMetric = coldStartMetrics.Metrics?.[0];
        expect(coldStartMetric?.Dimensions).toStrictEqual(expectedDimensions);

        // Check coldstart metric value
        const adjustedStartTime = new Date(startTime.getTime() - ONE_MINUTE);
        const endTime = new Date(new Date().getTime() + ONE_MINUTE);
        console.log(
          `Manual command: aws cloudwatch get-metric-statistics --namespace ${expectedNamespace} --metric-name ColdStart --start-time ${Math.floor(
            adjustedStartTime.getTime() / 1000
          )} --end-time ${Math.floor(
            endTime.getTime() / 1000
          )} --statistics 'Sum' --period 60 --dimensions '${JSON.stringify(
            expectedDimensions
          )}'`
        );
        const coldStartMetricStat = await cloudwatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: expectedNamespace,
            StartTime: adjustedStartTime,
            Dimensions: expectedDimensions,
            EndTime: endTime,
            Period: 60,
            MetricName: 'ColdStart',
            Statistics: ['Sum'],
          })
        );

        // Despite lambda has been called twice, coldstart metric sum should only be 1
        const singleDataPoint = coldStartMetricStat.Datapoints
          ? coldStartMetricStat.Datapoints[0]
          : {};
        expect(singleDataPoint?.Sum).toBe(1);
      },
      TEST_CASE_TIMEOUT
    );
  });

  describe('Default and extra dimensions', () => {
    it(
      'should produce a Metric with the default and extra one dimensions',
      async () => {
        // Check metric dimensions
        const metrics = await getMetrics(
          cloudwatchClient,
          expectedNamespace,
          expectedMetricName,
          1
        );

        expect(metrics.Metrics?.length).toBe(1);
        const metric = metrics.Metrics?.[0];
        const expectedDimensions = [
          { Name: 'service', Value: expectedServiceName },
          {
            Name: Object.keys(expectedDefaultDimensions)[0],
            Value: expectedDefaultDimensions.MyDimension,
          },
          {
            Name: Object.keys(expectedExtraDimension)[0],
            Value: expectedExtraDimension.MyExtraDimension,
          },
        ];
        expect(metric?.Dimensions).toStrictEqual(expectedDimensions);

        // Check coldstart metric value
        const adjustedStartTime = new Date(
          startTime.getTime() - 3 * ONE_MINUTE
        );
        const endTime = new Date(new Date().getTime() + ONE_MINUTE);
        console.log(
          `Manual command: aws cloudwatch get-metric-statistics --namespace ${expectedNamespace} --metric-name ${expectedMetricName} --start-time ${Math.floor(
            adjustedStartTime.getTime() / 1000
          )} --end-time ${Math.floor(
            endTime.getTime() / 1000
          )} --statistics 'Sum' --period 60 --dimensions '${JSON.stringify(
            expectedDimensions
          )}'`
        );
        const metricStat = await cloudwatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: expectedNamespace,
            StartTime: adjustedStartTime,
            Dimensions: expectedDimensions,
            EndTime: endTime,
            Period: 60,
            MetricName: expectedMetricName,
            Statistics: ['Sum'],
          })
        );

        // Since lambda has been called twice in this test and potentially more in others, metric sum should be at least of expectedMetricValue * invocationCount
        const singleDataPoint = metricStat.Datapoints
          ? metricStat.Datapoints[0]
          : {};
        expect(singleDataPoint?.Sum).toBeGreaterThanOrEqual(
          parseInt(expectedMetricValue) * invocations
        );
      },
      TEST_CASE_TIMEOUT
    );
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});
