import { randomUUID } from 'node:crypto';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { TestStack } from '../TestStack.js';
import { TEST_ARCHITECTURES, TEST_RUNTIMES } from '../constants.js';
import {
  concatenateResourceName,
  getArchitectureKey,
  getRuntimeKey,
} from '../helpers.js';
import type { ExtraTestProps, TestNodejsFunctionProps } from '../types.js';

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
    const isESM = extraProps.outputFormat === 'ESM';
    const { bundling, ...restProps } = props;

    super(stack.stack, `fn-${randomUUID().substring(0, 5)}`, {
      timeout: Duration.seconds(30),
      memorySize: 512,
      tracing: Tracing.ACTIVE,
      bundling: {
        ...bundling,
        minify: true,
        mainFields: isESM ? ['module', 'main'] : ['main', 'module'],
        sourceMap: false,
        format: isESM ? OutputFormat.ESM : OutputFormat.CJS,
        banner: isESM
          ? `import { createRequire } from 'module';const require = createRequire(import.meta.url);`
          : '',
      },
      ...restProps,
      functionName: concatenateResourceName({
        testName: stack.testName,
        resourceName: extraProps.nameSuffix,
      }),
      runtime: TEST_RUNTIMES[getRuntimeKey()],
      architecture: TEST_ARCHITECTURES[getArchitectureKey()],
      logRetention: RetentionDays.ONE_DAY,
    });

    new CfnOutput(this, extraProps.nameSuffix, {
      value: this.functionName,
    });
  }
}

export { TestNodejsFunction };
