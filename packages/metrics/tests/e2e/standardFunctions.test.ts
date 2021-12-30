// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Test metrics decorator
 *
 * @group e2e/metrics/decorator
 */

import { randomUUID } from 'crypto';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import { App, Stack } from '@aws-cdk/core';
import { SdkProvider } from 'aws-cdk/lib/api/aws-auth';
import { CloudFormationDeployments } from 'aws-cdk/lib/api/cloudformation-deployments';
import * as AWS from 'aws-sdk';
import { MetricUnits } from '../../src';

const cloudwatchClient = new AWS.CloudWatch();
const lambdaClient = new AWS.Lambda();

const integTestApp = new App();
const stack = new Stack(integTestApp, 'ExampleIntegTest');

describe('coldstart', () => {
  it('can be deploy succcessfully', async () => {
    // GIVEN
    const startTime = new Date();
    const expectedNamespace = randomUUID(); // to easily find metrics back at assert phase
    const expectedServiceName = 'MyFunctionWithStandardHandler';
    const expectedMetricName = 'MyMetric';
    const expectedMetricUnit = MetricUnits.Count;
    const expectedMetricValue = '1';
    const expectedDefaultDimensions = { MyDimension: 'MyValue' };
    const expectedExtraDimension = { MyExtraDimension: 'MyExtraValue' };
    const expectedSingleMetricDimension = { MySingleMetricDim: 'MySingleValue' };
    const expectedSingleMetricName = 'MySingleMetric';
    const expectedSingleMetricUnit = MetricUnits.Percent;
    const expectedSingleMetricValue = '2';
    const functionName = 'MyFunctionWithStandardHandler';
    new lambda.NodejsFunction(stack, 'MyFunction', {
      functionName: functionName,
      environment: {
        EXPECTED_NAMESPACE: expectedNamespace,
        EXPECTED_SERVICE_NAME: expectedServiceName,
        EXPECTED_METRIC_NAME: expectedMetricName,
        EXPECTED_METRIC_UNIT: expectedMetricUnit,
        EXPECTED_METRIC_VALUE: expectedMetricValue,
        EXPECTED_DEFAULT_DIMENSIONS: JSON.stringify(expectedDefaultDimensions),
        EXPECTED_EXTRA_DIMENSION: JSON.stringify(expectedExtraDimension),
        EXPECTED_SINGLE_METRIC_DIMENSION: JSON.stringify(expectedSingleMetricDimension),
        EXPECTED_SINGLE_METRIC_NAME: expectedSingleMetricName,
        EXPECTED_SINGLE_METRIC_UNIT: expectedSingleMetricUnit,
        EXPECTED_SINGLE_METRIC_VALUE: expectedSingleMetricValue,
      },
    });

    const stackArtifact = integTestApp.synth().getStackByName(stack.stackName);

    const sdkProvider = await SdkProvider.withAwsCliCompatibleDefaults({
      profile: process.env.AWS_PROFILE,
    });
    const cloudFormation = new CloudFormationDeployments({ sdkProvider });

    // WHEN
    // lambda function is deployed
    await cloudFormation.deployStack({
      stack: stackArtifact,
    });
    // and invoked
    await lambdaClient
      .invoke({
        FunctionName: functionName,
      })
      .promise();
    // twice
    await lambdaClient
      .invoke({
        FunctionName: functionName,
      })
      .promise();

    // THEN
    // sleep to allow metrics to be collected
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check coldstart metric dimensions
    const coldStartMetrics = await cloudwatchClient
      .listMetrics({
        Namespace: expectedNamespace,
        MetricName: 'ColdStart',
      })
      .promise();
    expect(coldStartMetrics.Metrics?.length).toBe(1);
    const coldStartMetric = coldStartMetrics.Metrics?.[0];
    expect(coldStartMetric?.Dimensions).toStrictEqual([{ Name: 'service', Value: expectedServiceName }]);

    // Check coldstart metric value
    const coldStartMetricStat = await cloudwatchClient
      .getMetricStatistics(
        {
          Namespace: expectedNamespace,
          StartTime: new Date(startTime.getTime() - 60 * 1000), // minus 1 minute,
          Dimensions: [{ Name: 'service', Value: expectedServiceName }],
          EndTime: new Date(new Date().getTime() + 60 * 1000),
          Period: 60,
          MetricName: 'ColdStart',
          Statistics: ['Sum'],
        },
        undefined,
      )
      .promise();

    // Despite lambda has been called twice, coldstart metric sum should only be 1
    const singleDataPoint = coldStartMetricStat.Datapoints ? coldStartMetricStat.Datapoints[0] : {};
    expect(singleDataPoint.Sum).toBe(1);
  }, 9000000);
});

afterAll(async () => {
  if (!process.env.DISABLE_TEARDOWN) {
    const stackArtifact = integTestApp.synth().getStackByName(stack.stackName);

    const sdkProvider = await SdkProvider.withAwsCliCompatibleDefaults({
      profile: process.env.AWS_PROFILE,
    });
    const cloudFormation = new CloudFormationDeployments({ sdkProvider });

    await cloudFormation.destroyStack({
      stack: stackArtifact,
    });
  }
}, 9000000);
