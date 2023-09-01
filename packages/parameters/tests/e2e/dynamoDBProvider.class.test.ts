/**
 * Test DynamoDBProvider class
 *
 * @group e2e/parameters/dynamodb/class
 */
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  invokeFunctionOnce,
  isValidRuntimeKey,
  TestInvocationLogs,
  TestNodejsFunction,
  TestStack,
  TEST_RUNTIMES,
} from '@aws-lambda-powertools/testing-utils';
import { Aspects } from 'aws-cdk-lib';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { join } from 'node:path';
import { ResourceAccessGranter } from '../helpers/cdkAspectGrantAccess';
import {
  createDynamoDBTable,
  putDynamoDBItem,
} from '../helpers/parametersUtils';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

/**
 * This test suite deploys a CDK stack with a Lambda function and a number of DynamoDB tables.
 * The function code uses the Parameters utility to retrieve values from the DynamoDB tables.
 * It then logs the values to CloudWatch Logs as JSON.
 *
 * Once the stack is deployed, the Lambda function is invoked and the CloudWatch Logs are retrieved.
 * The logs are then parsed and the values are compared to the expected values in each test case.
 *
 * The tables are populated with data before the Lambda function is invoked. These tables and values
 * allow to test the different use cases of the DynamoDBProvider class.
 *
 * The tables are:
 *
 * - Table-Get: a table with a single partition key (id) and attribute (value)
 * +-----------------+----------------------+
 * |       id        |        value         |
 * +-----------------+----------------------+
 * | my-param        | foo                  |
 * | my-param-json   | "{\"foo\": \"bar\"}" |
 * | my-param-binary | "YmF6"               |
 * +-----------------+----------------------+
 *
 * - Table-GetMultiple: a table with a partition key (id) and a sort key (sk) and attribute (value)
 * +-------------------+---------------+----------------------+
 * |        id         |      sk       |        value         |
 * +-------------------+---------------+----------------------+
 * | my-params         | config        | bar                  |
 * | my-params         | key           | baz                  |
 * | my-encoded-params | config.json   | "{\"foo\": \"bar\"}" |
 * | my-encoded-params | config.binary | "YmF6"               |
 * +-------------------+---------------+----------------------+
 *
 * - Table-GetCustomKeys: a table with a single partition key (key) and attribute (val)
 * +-----------------+----------------------+
 * |       key       |         val          |
 * +-----------------+----------------------+
 * | my-param        | foo                  |
 * +-----------------+----------------------+
 *
 * - Table-GetMultipleCustomKeys: a table with a partition key (key) and a sort key (sort) and attribute (val)
 * +-------------------+---------------+----------------------+
 * |        key        |     sort      |         val          |
 * +-------------------+---------------+----------------------+
 * | my-params         | config        | bar                  |
 * | my-params         | key           | baz                  |
 * +-------------------+---------------+----------------------+
 *
 * The tests are:
 *
 * Test 1
 * Get a single parameter with default options (keyAttr: 'id', valueAttr: 'value') from table Table-Get
 *
 * Test 2
 * Get multiple parameters with default options (keyAttr: 'id', sortAttr: 'sk', valueAttr: 'value') from table Table-GetMultiple
 *
 * Test 3
 * Get a single parameter with custom options (keyAttr: 'key', valueAttr: 'val') from table Table-GetCustomKeys
 *
 * Test 4
 * Get multiple parameters with custom options (keyAttr: 'key', sortAttr: 'sort', valueAttr: 'val') from table Table-GetMultipleCustomKeys
 *
 * Test 5
 * Get a single JSON parameter with default options (keyAttr: 'id', valueAttr: 'value') and transform from table Table-Get
 *
 * Test 6
 * Get a single binrary parameter with default options (keyAttr: 'id', valueAttr: 'value') and transform it from table Table-Get
 *
 * Test 7
 * Get multiple JSON and binary parameters with default options (keyAttr: 'id', sortAttr: 'sk', valueAttr: 'value') and transform them automatically from table Table-GetMultiple
 *
 * Test 8
 * Get a parameter twice and check that the value is cached. This uses a custom SDK client that counts the number of calls to DynamoDB.
 *
 * Test 9
 * Get a cached parameter and force retrieval. This also uses the same custom SDK client that counts the number of calls to DynamoDB.
 */
describe(`Parameters E2E tests, dynamoDB provider`, () => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  const testName = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'AllFeatures-Decorator',
  });
  const testStack = new TestStack(testName);

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'dynamoDBProvider.class.test.functionCode.ts'
  );

  const functionName = concatenateResourceName({
    testName,
    resourceName: 'dynamoDBProvider',
  });

  // Parameters to be used by Parameters in the Lambda function
  const tableGet = concatenateResourceName({
    testName,
    resourceName: 'Table-Get',
  });

  const tableGetMultiple = concatenateResourceName({
    testName,
    resourceName: 'Table-GetMultiple',
  });

  const tableGetCustomkeys = concatenateResourceName({
    testName,
    resourceName: 'Table-GetCustomKeys',
  });

  const tableGetMultipleCustomkeys = concatenateResourceName({
    testName,
    resourceName: 'Table-GetMultipleCustomKeys',
  });

  const keyAttr = 'key';
  const sortAttr = 'sort';
  const valueAttr = 'val';

  let invocationLogs: TestInvocationLogs;

  beforeAll(async () => {
    // Prepare
    new TestNodejsFunction(testStack.stack, functionName, {
      functionName,
      entry: lambdaFunctionCodeFile,
      runtime: TEST_RUNTIMES[runtime],
      environment: {
        TABLE_GET: tableGet,
        TABLE_GET_MULTIPLE: tableGetMultiple,
        TABLE_GET_CUSTOM_KEYS: tableGetCustomkeys,
        TABLE_GET_MULTIPLE_CUSTOM_KEYS: tableGetMultipleCustomkeys,
        KEY_ATTR: keyAttr,
        SORT_ATTR: sortAttr,
        VALUE_ATTR: valueAttr,
      },
    });

    // Create the DynamoDB tables
    const ddbTableGet = createDynamoDBTable({
      stack: testStack.stack,
      id: 'Table-get',
      tableName: tableGet,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
    });
    const ddbTableGetMultiple = createDynamoDBTable({
      stack: testStack.stack,
      id: 'Table-getMultiple',
      tableName: tableGetMultiple,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
    });
    const ddbTableGetCustomKeys = createDynamoDBTable({
      stack: testStack.stack,
      id: 'Table-getCustomKeys',
      tableName: tableGetCustomkeys,
      partitionKey: {
        name: keyAttr,
        type: AttributeType.STRING,
      },
    });
    const ddbTabelGetMultipleCustomKeys = createDynamoDBTable({
      stack: testStack.stack,
      id: 'Table-getMultipleCustomKeys',
      tableName: tableGetMultipleCustomkeys,
      partitionKey: {
        name: keyAttr,
        type: AttributeType.STRING,
      },
      sortKey: {
        name: sortAttr,
        type: AttributeType.STRING,
      },
    });

    // Give the Lambda access to the DynamoDB tables
    Aspects.of(testStack.stack).add(
      new ResourceAccessGranter([
        ddbTableGet,
        ddbTableGetMultiple,
        ddbTableGetCustomKeys,
        ddbTabelGetMultipleCustomKeys,
      ])
    );

    // Seed tables with test data
    // Test 1
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test1',
      table: ddbTableGet,
      item: {
        id: 'my-param',
        value: 'foo',
      },
    });

    // Test 2
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test2-a',
      table: ddbTableGetMultiple,
      item: {
        id: 'my-params',
        sk: 'config',
        value: 'bar',
      },
    });
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test2-b',
      table: ddbTableGetMultiple,
      item: {
        id: 'my-params',
        sk: 'key',
        value: 'baz',
      },
    });

    // Test 3
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test3',
      table: ddbTableGetCustomKeys,
      item: {
        [keyAttr]: 'my-param',
        [valueAttr]: 'foo',
      },
    });

    // Test 4
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test4-a',
      table: ddbTabelGetMultipleCustomKeys,
      item: {
        [keyAttr]: 'my-params',
        [sortAttr]: 'config',
        [valueAttr]: 'bar',
      },
    });
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test4-b',
      table: ddbTabelGetMultipleCustomKeys,
      item: {
        [keyAttr]: 'my-params',
        [sortAttr]: 'key',
        [valueAttr]: 'baz',
      },
    });

    // Test 5
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test5',
      table: ddbTableGet,
      item: {
        id: 'my-param-json',
        value: JSON.stringify({ foo: 'bar' }),
      },
    });

    // Test 6
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test6',
      table: ddbTableGet,
      item: {
        id: 'my-param-binary',
        value: 'YmF6', // base64 encoded 'baz'
      },
    });

    // Test 7
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test7-a',
      table: ddbTableGetMultiple,
      item: {
        id: 'my-encoded-params',
        sk: 'config.json',
        value: JSON.stringify({ foo: 'bar' }),
      },
    });
    putDynamoDBItem({
      stack: testStack.stack,
      id: 'my-param-test7-b',
      table: ddbTableGetMultiple,
      item: {
        id: 'my-encoded-params',
        sk: 'key.binary',
        value: 'YmF6', // base64 encoded 'baz'
      },
    });

    // Test 8 & 9 use the same items as Test 1

    // Deploy the stack
    await testStack.deploy();

    // and invoke the Lambda function
    invocationLogs = await invokeFunctionOnce({
      functionName,
    });
  }, SETUP_TIMEOUT);

  describe('DynamoDBProvider usage', () => {
    // Test 1 - get a single parameter with default options (keyAttr: 'id', valueAttr: 'value')
    it(
      'should retrieve a single parameter',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[0]);

        expect(testLog).toStrictEqual({
          test: 'get',
          value: 'foo',
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 2 - get multiple parameters with default options (keyAttr: 'id', sortAttr: 'sk', valueAttr: 'value')
    it(
      'should retrieve multiple parameters',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[1]);

        expect(testLog).toStrictEqual({
          test: 'get-multiple',
          value: { config: 'bar', key: 'baz' },
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 3 - get a single parameter with custom options (keyAttr: 'key', valueAttr: 'val')
    it(
      'should retrieve a single parameter',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[2]);

        expect(testLog).toStrictEqual({
          test: 'get-custom',
          value: 'foo',
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 4 - get multiple parameters with custom options (keyAttr: 'key', sortAttr: 'sort', valueAttr: 'val')
    it(
      'should retrieve multiple parameters',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[3]);

        expect(testLog).toStrictEqual({
          test: 'get-multiple-custom',
          value: { config: 'bar', key: 'baz' },
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 5 - get a single parameter with json transform
    it('should retrieve a single parameter with json transform', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[4]);

      expect(testLog).toStrictEqual({
        test: 'get-json-transform',
        value: { foo: 'bar' },
      });
    });

    // Test 6 - get a single parameter with binary transform
    it('should retrieve a single parameter with binary transform', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[5]);

      expect(testLog).toStrictEqual({
        test: 'get-binary-transform',
        value: 'baz',
      });
    });

    // Test 7 - get multiple parameters with auto transforms (json and binary)
    it('should retrieve multiple parameters with auto transforms', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[6]);

      expect(testLog).toStrictEqual({
        test: 'get-multiple-auto-transform',
        value: {
          'config.json': { foo: 'bar' },
          'key.binary': 'baz',
        },
      });
    });

    // Test 8 - Get a parameter twice and check that the value is cached.
    it('should retrieve multiple parameters with auto transforms', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[7]);

      expect(testLog).toStrictEqual({
        test: 'get-cached',
        value: 1,
      });
    });

    // Test 9 - Get a cached parameter and force retrieval.
    it('should retrieve multiple parameters with auto transforms', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[8]);

      expect(testLog).toStrictEqual({
        test: 'get-forced',
        value: 2,
      });
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});
