# AWS Lambda Powertools (TypeScript) examples in CDK

This is a deployable CDK app that deploys AWS Lambda functions as part of a CloudFormation stack. These Lambda functions use the utilities made available as part of AWS Lambda Powertools (TypeScript) to demonstrate their usage.

You will need to have a valid AWS Account in order to deploy these resources. These resources may incur costs to your AWS Account.

The example functions, located in the `lib` folder, are invoked automatically, twice, when deployed using the CDK construct defined in `lib/example-function.ts`. The first invocation demonstrates the effect on logs/metrics/annotations when the Lambda function has a cold start, and the latter without a cold start.

## Deploying the stack

 * Ensure that CDK v2 is installed globally on your machine (if not, run `npm install -g aws-cdk`)
 * Navigate to this location of the repo in your terminal (`examples/cdk`)
 * `npm install`
 * `cdk deploy --all --profile <YOUR_AWS_PROFILE>`

Note: Prior to deploying you may need to run `cdk bootstrap aws://<YOU_AWS_ACCOUNT_ID>/<AWS_REGION> --profile <YOUR_AWS_PROFILE>` if you have not already bootstrapped your account for CDK.

## Viewing Utility Outputs

All utility outputs can be viewed in the Amazon CloudWatch console.

 * `Logger` output can be found in Logs > Log groups
 * `Metrics` output can be found in Metrics > All metrics > CdkExample
 * `Tracer` output can be found in  X-Ray traces > Traces
