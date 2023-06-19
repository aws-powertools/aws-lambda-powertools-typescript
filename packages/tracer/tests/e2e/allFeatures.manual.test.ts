/**
 * Test tracer manual mode
 *
 * @group e2e/tracer/manual
 */

import path from 'path';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { XRayClient } from '@aws-sdk/client-xray';
import { STSClient } from '@aws-sdk/client-sts';
import { v4 } from 'uuid';
import {
  deployStack,
  destroyStack,
} from '../../../commons/tests/utils/cdk-cli';
import {
  createTracerTestFunction,
  getFirstSubsegment,
  getFunctionArn,
  getInvocationSubsegment,
  getTraces,
  invokeAllTestCases,
  splitSegmentsByName,
} from '../helpers/tracesUtils';
import type { ParsedTrace } from '../helpers/traceUtils.types';
import {
  generateUniqueName,
  isValidRuntimeKey,
} from '../../../commons/tests/utils/e2eUtils';
import {
  expectedCustomAnnotationKey,
  expectedCustomAnnotationValue,
  expectedCustomErrorMessage,
  expectedCustomMetadataKey,
  expectedCustomMetadataValue,
  expectedCustomResponseValue,
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';
import {
  assertAnnotation,
  assertErrorAndFault,
} from '../helpers/traceAssertions';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const uuid = v4();
const stackName = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'AllFeatures-Manual'
);
const functionName = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'AllFeatures-Manual'
);
const lambdaFunctionCodeFile = 'allFeatures.manual.test.functionCode.ts';
const expectedServiceName = functionName;

const xrayClient = new XRayClient({});
const stsClient = new STSClient({});
const invocations = 3;
let sortedTraces: ParsedTrace[];

const integTestApp = new App();
let stack: Stack;

describe(`Tracer E2E tests, all features with manual instantiation for runtime: ${runtime}`, () => {
  beforeAll(async () => {
    // Prepare
    const startTime = new Date();
    const ddbTableName = stackName + '-table';
    stack = new Stack(integTestApp, stackName);

    const entry = path.join(__dirname, lambdaFunctionCodeFile);
    const environmentParams = {
      TEST_TABLE_NAME: ddbTableName,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
      POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
      POWERTOOLS_TRACE_ENABLED: 'true',
    };
    const testFunction = createTracerTestFunction({
      stack,
      functionName,
      entry,
      expectedServiceName,
      environmentParams,
      runtime,
    });

    const ddbTable = new Table(stack, 'Table', {
      tableName: ddbTableName,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    ddbTable.grantWriteData(testFunction);

    await deployStack(integTestApp, stack);

    // Act
    await invokeAllTestCases(functionName);

    // Retrieve traces from X-Ray for assertion
    const lambdaFunctionArn = await getFunctionArn(stsClient, functionName);
    sortedTraces = await getTraces(
      xrayClient,
      startTime,
      lambdaFunctionArn,
      invocations,
      4
    );
  }, SETUP_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);

  it(
    'should generate all custom traces',
    async () => {
      expect(sortedTraces.length).toBe(invocations);

      // Assess
      for (let i = 0; i < invocations; i++) {
        const trace = sortedTraces[i];

        /**
         * Expect the trace to have 4 segments:
         * 1. Lambda Context (AWS::Lambda)
         * 2. Lambda Function (AWS::Lambda::Function)
         * 3. DynamoDB (AWS::DynamoDB)
         * 4. Remote call (awslabs.github.io)
         */
        expect(trace.Segments.length).toBe(4);
        const invocationSubsegment = getInvocationSubsegment(trace);

        /**
         * Invocation subsegment should have a subsegment '## index.handler' (default behavior for Tracer)
         * '## index.handler' subsegment should have 2 subsegments
         * 1. DynamoDB (PutItem on the table)
         * 2. awslabs.github.io (Remote call)
         */
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        expect(handlerSubsegment.name).toBe('## index.handler');
        expect(handlerSubsegment?.subsegments).toHaveLength(2);

        if (!handlerSubsegment.subsegments) {
          fail('"## index.handler" subsegment should have subsegments');
        }
        const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [
          'DynamoDB',
          'awslabs.github.io',
        ]);
        expect(subsegments.get('DynamoDB')?.length).toBe(1);
        expect(subsegments.get('awslabs.github.io')?.length).toBe(1);
        expect(subsegments.get('other')?.length).toBe(0);

        const shouldThrowAnError = i === invocations - 1;
        if (shouldThrowAnError) {
          assertErrorAndFault(invocationSubsegment, expectedCustomErrorMessage);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should have correct annotations and metadata',
    async () => {
      for (let i = 0; i < invocations; i++) {
        const trace = sortedTraces[i];
        const invocationSubsegment = getInvocationSubsegment(trace);
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        const { annotations, metadata } = handlerSubsegment;

        const isColdStart = i === 0;
        assertAnnotation({
          annotations,
          isColdStart,
          expectedServiceName,
          expectedCustomAnnotationKey,
          expectedCustomAnnotationValue,
        });

        if (!metadata) {
          fail('metadata is missing');
        }
        expect(
          metadata[expectedServiceName][expectedCustomMetadataKey]
        ).toEqual(expectedCustomMetadataValue);

        const shouldThrowAnError = i === invocations - 1;
        if (!shouldThrowAnError) {
          // Assert that the metadata object contains the response
          expect(
            metadata[expectedServiceName]['index.handler response']
          ).toEqual(expectedCustomResponseValue);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );
});
