import type {
  ExtraTestProps,
  TestNodejsFunctionProps,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils';
import { commonEnvironmentVars } from '../e2e/constants';

class TracerTestNodejsFunction extends TestNodejsFunction {
  public constructor(
    scope: TestStack,
    props: TestNodejsFunctionProps,
    extraProps: ExtraTestProps
  ) {
    super(
      scope,
      {
        ...props,
        environment: {
          ...commonEnvironmentVars,
          EXPECTED_SERVICE_NAME: extraProps.nameSuffix,
          EXPECTED_CUSTOM_METADATA_VALUE: JSON.stringify(
            commonEnvironmentVars.EXPECTED_CUSTOM_METADATA_VALUE
          ),
          EXPECTED_CUSTOM_RESPONSE_VALUE: JSON.stringify(
            commonEnvironmentVars.EXPECTED_CUSTOM_RESPONSE_VALUE
          ),
          ...props.environment,
        },
      },
      extraProps
    );
  }
}

export { TracerTestNodejsFunction };
