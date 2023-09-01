import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { randomUUID } from 'node:crypto';
import { TEST_RUNTIMES } from '../constants';
import { concatenateResourceName, getRuntimeKey } from '../helpers';
import type { TestStack } from '../TestStack';
import type { ExtraTestProps, TestNodejsFunctionProps } from './types';

/**
 * A NodejsFunction that can be used in tests.
 *
 * It includes some default props and outputs the function name.
 */
class TestNodejsFunction extends NodejsFunction {
  public constructor(
    stack: TestStack,
    props: TestNodejsFunctionProps,
    extraProps: ExtraTestProps
  ) {
    super(stack.stack, `fn-${randomUUID().substring(0, 5)}`, {
      timeout: Duration.seconds(30),
      memorySize: 256,
      tracing: Tracing.ACTIVE,
      ...props,
      functionName: concatenateResourceName({
        testName: stack.testName,
        resourceName: extraProps.nameSuffix,
      }),
      runtime: TEST_RUNTIMES[getRuntimeKey()],
      logRetention: RetentionDays.ONE_DAY,
    });

    new CfnOutput(this, extraProps.nameSuffix, {
      value: this.functionName,
    });
  }
}

export { ExtraTestProps, TestNodejsFunction, TestNodejsFunctionProps };
