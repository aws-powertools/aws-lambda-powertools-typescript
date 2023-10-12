/**
 * Test tracer in decorator setup
 *
 * @group e2e/tracer/decorator
 */
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestDynamodbTable } from '@aws-lambda-powertools/testing-utils/resources/dynamodb';
import { join } from 'node:path';
import { TracerTestNodejsFunction } from '../helpers/resources';
import {
  assertAnnotation,
  assertErrorAndFault,
} from '../helpers/traceAssertions';
import {
  getFirstSubsegment,
  getInvocationSubsegment,
  getTraces,
  invokeAllTestCases,
  splitSegmentsByName,
} from '../helpers/tracesUtils';
import {
  commonEnvironmentVars,
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

/**
 * The test includes one stack with 4 Lambda functions that correspond to the following test cases:
 * 1. With all flags enabled (capture both response and error)
 * 2. Do not capture error or response
 * 3. Do not enable tracer
 * 4. Disable capture response via decorator options
 * Each stack must use a unique `serviceName` as it's used to for retrieving the trace.
 * Using the same one will result in traces from different test cases mixing up.
 */
describe(`Tracer E2E tests, all features with decorator instantiation`, () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'AllFeatures-Decorator',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'allFeatures.decorator.test.functionCode.ts'
  );
  const startTime = new Date();

  /**
   * Table used by all functions to make an SDK call
   */
  const testTable = new TestDynamodbTable(
    testStack,
    {},
    {
      nameSuffix: 'TestTable',
    }
  );

  /**
   * Function #1 is with all flags enabled.
   */
  let fnNameAllFlagsEnabled: string;
  const fnAllFlagsEnabled = new TracerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
      },
    },
    {
      nameSuffix: 'AllFlagsOn',
    }
  );
  testTable.grantWriteData(fnAllFlagsEnabled);

  /**
   * Function #2 doesn't capture error or response
   */
  let fnNameNoCaptureErrorOrResponse: string;
  const fnNoCaptureErrorOrResponse = new TracerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
        POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'false',
        POWERTOOLS_TRACER_CAPTURE_ERROR: 'false',
      },
    },
    {
      nameSuffix: 'NoCaptureErrOrResp',
    }
  );
  testTable.grantWriteData(fnNoCaptureErrorOrResponse);

  /**
   * Function #3 disables tracer
   */
  let fnNameTracerDisabled: string;
  const fnTracerDisabled = new TracerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
        POWERTOOLS_TRACE_ENABLED: 'false',
      },
    },
    {
      nameSuffix: 'TracerDisabled',
    }
  );
  testTable.grantWriteData(fnTracerDisabled);

  /**
   * Function #4 disables capture response via decorator options
   */
  let fnNameCaptureResponseOff: string;
  const fnCaptureResponseOff = new TracerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      handler: 'handlerWithCaptureResponseFalse',
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
      },
    },
    {
      nameSuffix: 'CaptureResponseOff',
    }
  );
  testTable.grantWriteData(fnCaptureResponseOff);

  const invocationCount = 3;

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    fnNameAllFlagsEnabled = testStack.findAndGetStackOutputValue('AllFlagsOn');
    fnNameNoCaptureErrorOrResponse =
      testStack.findAndGetStackOutputValue('NoCaptureErrOrResp');
    fnNameTracerDisabled =
      testStack.findAndGetStackOutputValue('TracerDisabled');
    fnNameCaptureResponseOff =
      testStack.findAndGetStackOutputValue('CaptureResponseOff');

    // Invoke all functions
    await Promise.all([
      invokeAllTestCases(fnNameAllFlagsEnabled, invocationCount),
      invokeAllTestCases(fnNameNoCaptureErrorOrResponse, invocationCount),
      invokeAllTestCases(fnNameTracerDisabled, invocationCount),
      invokeAllTestCases(fnNameCaptureResponseOff, invocationCount),
    ]);
  }, SETUP_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);

  it(
    'should generate all custom traces',
    async () => {
      const { EXPECTED_CUSTOM_ERROR_MESSAGE: expectedCustomErrorMessage } =
        commonEnvironmentVars;

      /**
       * The trace should have 4 segments:
       * 1. Lambda Context (AWS::Lambda)
       * 2. Lambda Function (AWS::Lambda::Function)
       * 4. DynamoDB (AWS::DynamoDB)
       * 4. Remote call (docs.powertools.aws.dev)
       */
      const tracesWhenAllFlagsEnabled = await getTraces({
        startTime,
        resourceName: fnNameAllFlagsEnabled,
        expectedTracesCount: invocationCount,
        expectedSegmentsCount: 4,
      });

      // Assess
      for (let i = 0; i < invocationCount; i++) {
        const trace = tracesWhenAllFlagsEnabled[i];
        const invocationSubsegment = getInvocationSubsegment(trace);

        /**
         * Invocation subsegment should have a subsegment '## index.handler' (default behavior for Tracer)
         * '## index.handler' subsegment should have 3 subsegments
         * 1. DynamoDB (PutItem on the table)
         * 2. docs.powertools.aws.dev (Remote call)
         * 3. '### myMethod' (method decorator)
         */
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        expect(handlerSubsegment.name).toBe('## index.handler');
        expect(handlerSubsegment?.subsegments).toHaveLength(3);

        if (!handlerSubsegment.subsegments) {
          fail('"## index.handler" subsegment should have subsegments');
        }
        const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [
          'DynamoDB',
          'docs.powertools.aws.dev',
          '### myMethod',
        ]);
        expect(subsegments.get('DynamoDB')?.length).toBe(1);
        expect(subsegments.get('docs.powertools.aws.dev')?.length).toBe(1);
        expect(subsegments.get('### myMethod')?.length).toBe(1);
        expect(subsegments.get('other')?.length).toBe(0);

        const shouldThrowAnError = i === invocationCount - 1;
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
      const {
        EXPECTED_CUSTOM_ANNOTATION_KEY: expectedCustomAnnotationKey,
        EXPECTED_CUSTOM_ANNOTATION_VALUE: expectedCustomAnnotationValue,
        EXPECTED_CUSTOM_METADATA_KEY: expectedCustomMetadataKey,
        EXPECTED_CUSTOM_METADATA_VALUE: expectedCustomMetadataValue,
        EXPECTED_CUSTOM_RESPONSE_VALUE: expectedCustomResponseValue,
      } = commonEnvironmentVars;

      const tracesWhenAllFlagsEnabled = await getTraces({
        startTime,
        resourceName: fnNameAllFlagsEnabled,
        expectedTracesCount: invocationCount,
        expectedSegmentsCount: 4,
      });

      for (let i = 0; i < invocationCount; i++) {
        const trace = tracesWhenAllFlagsEnabled[i];
        const invocationSubsegment = getInvocationSubsegment(trace);
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        const { annotations, metadata } = handlerSubsegment;

        const isColdStart = i === 0;
        assertAnnotation({
          annotations,
          isColdStart,
          expectedServiceName: 'AllFlagsOn',
          expectedCustomAnnotationKey,
          expectedCustomAnnotationValue,
        });

        if (!metadata) {
          fail('metadata is missing');
        }
        expect(metadata['AllFlagsOn'][expectedCustomMetadataKey]).toEqual(
          expectedCustomMetadataValue
        );

        const shouldThrowAnError = i === invocationCount - 1;
        if (!shouldThrowAnError) {
          // Assert that the metadata object contains the response
          expect(metadata['AllFlagsOn']['index.handler response']).toEqual(
            expectedCustomResponseValue
          );
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should not capture error nor response when the flags are false',
    async () => {
      /**
       * Expect the trace to have 4 segments:
       * 1. Lambda Context (AWS::Lambda)
       * 2. Lambda Function (AWS::Lambda::Function)
       * 3. DynamoDB (AWS::DynamoDB)
       * 4. Remote call (docs.powertools.aws.dev)
       */
      const tracesWithNoCaptureErrorOrResponse = await getTraces({
        startTime,
        resourceName: fnNameNoCaptureErrorOrResponse,
        expectedTracesCount: invocationCount,
        expectedSegmentsCount: 4,
      });

      // Assess
      for (let i = 0; i < invocationCount; i++) {
        const trace = tracesWithNoCaptureErrorOrResponse[i];
        const invocationSubsegment = getInvocationSubsegment(trace);
        /**
         * Invocation subsegment should have a subsegment '## index.handler' (default behavior for Tracer)
         * '## index.handler' subsegment should have 3 subsegments
         * 1. DynamoDB (PutItem on the table)
         * 2. docs.powertools.aws.dev (Remote call)
         * 3. '### myMethod' (method decorator)
         */
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        expect(handlerSubsegment.name).toBe('## index.handler');
        expect(handlerSubsegment?.subsegments).toHaveLength(3);

        if (!handlerSubsegment.subsegments) {
          fail('"## index.handler" subsegment should have subsegments');
        }
        const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [
          'DynamoDB',
          'docs.powertools.aws.dev',
          '### myMethod',
        ]);
        expect(subsegments.get('DynamoDB')?.length).toBe(1);
        expect(subsegments.get('docs.powertools.aws.dev')?.length).toBe(1);
        expect(subsegments.get('### myMethod')?.length).toBe(1);
        expect(subsegments.get('other')?.length).toBe(0);

        const shouldThrowAnError = i === invocationCount - 1;
        if (shouldThrowAnError) {
          // Assert that the subsegment has the expected fault
          expect(invocationSubsegment.error).toBe(true);
          expect(handlerSubsegment.error).toBe(true);
          // Assert that no error was captured on the subsegment
          expect(handlerSubsegment.hasOwnProperty('cause')).toBe(false);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should not capture response when captureResponse is set to false',
    async () => {
      const { EXPECTED_CUSTOM_ERROR_MESSAGE: expectedCustomErrorMessage } =
        commonEnvironmentVars;

      /**
       * Expect the trace to have 4 segments:
       * 1. Lambda Context (AWS::Lambda)
       * 2. Lambda Function (AWS::Lambda::Function)
       * 3. DynamoDB (AWS::DynamoDB)
       * 4. Remote call (docs.powertools.aws.dev)
       */
      const tracesWithCaptureResponseFalse = await getTraces({
        startTime,
        resourceName: fnNameCaptureResponseOff,
        expectedTracesCount: invocationCount,
        expectedSegmentsCount: 4,
      });

      // Assess
      for (let i = 0; i < invocationCount; i++) {
        const trace = tracesWithCaptureResponseFalse[i];
        const invocationSubsegment = getInvocationSubsegment(trace);
        /**
         * Invocation subsegment should have a subsegment '## index.handler' (default behavior for Tracer)
         * '## index.handler' subsegment should have 3 subsegments
         * 1. DynamoDB (PutItem on the table)
         * 2. docs.powertools.aws.dev (Remote call)
         * 3. '### myMethod' (method decorator)
         */
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        expect(handlerSubsegment.name).toBe(
          '## index.handlerWithCaptureResponseFalse'
        );
        expect(handlerSubsegment?.subsegments).toHaveLength(3);

        if (!handlerSubsegment.subsegments) {
          fail(
            '"## index.handlerWithCaptureResponseFalse" subsegment should have subsegments'
          );
        }
        const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [
          'DynamoDB',
          'docs.powertools.aws.dev',
          '### myMethod',
        ]);
        expect(subsegments.get('DynamoDB')?.length).toBe(1);
        expect(subsegments.get('docs.powertools.aws.dev')?.length).toBe(1);
        expect(subsegments.get('### myMethod')?.length).toBe(1);
        expect(subsegments.get('other')?.length).toBe(0);

        // No metadata because capturing the response was disabled and that's
        // the only metadata that could be in the subsegment for the test.
        const myMethodSegment = subsegments.get('### myMethod')?.[0];
        expect(myMethodSegment).toBeDefined();
        expect(myMethodSegment).not.toHaveProperty('metadata');

        const shouldThrowAnError = i === invocationCount - 1;
        if (shouldThrowAnError) {
          assertErrorAndFault(invocationSubsegment, expectedCustomErrorMessage);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should not capture any custom traces when disabled',
    async () => {
      const tracesWithTracerDisabled = await getTraces({
        startTime,
        resourceName: fnNameTracerDisabled,
        expectedTracesCount: invocationCount,
        expectedSegmentsCount: 2,
      });

      // Assess
      for (let i = 0; i < invocationCount; i++) {
        const trace = tracesWithTracerDisabled[i];
        /**
         * Expect no subsegment in the invocation
         */
        const invocationSubsegment = getInvocationSubsegment(trace);
        expect(invocationSubsegment?.subsegments).toBeUndefined();

        const shouldThrowAnError = i === invocationCount - 1;
        if (shouldThrowAnError) {
          expect(invocationSubsegment.error).toBe(true);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );
});
