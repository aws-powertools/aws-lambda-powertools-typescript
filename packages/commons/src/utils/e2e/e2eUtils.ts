// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CloudFormationStackArtifact } from '@aws-cdk/cx-api';
import { SdkProvider } from 'aws-cdk/lib/api/aws-auth';
import { CloudFormationDeployments } from 'aws-cdk/lib/api/cloudformation-deployments';
import { App, CfnOutput, Stack } from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import { Runtime, Tracing } from '@aws-cdk/aws-lambda';
import * as AWS from 'aws-sdk';

import { InvocationLogs } from './InvocationLogs';

const lambdaClient = new AWS.Lambda();

const testRuntimeKeys = [ 'nodejs12x', 'nodejs14x' ];
export type TestRuntimesKey = typeof testRuntimeKeys[number];
const TEST_RUNTIMES: Record<TestRuntimesKey, Runtime> = {
  nodejs12x: Runtime.NODEJS_12_X,
  nodejs14x: Runtime.NODEJS_14_X,
};

export type StackWithLambdaFunctionOptions = {
  app: App
  stackName: string
  functionName: string
  functionEntry: string
  tracing?: Tracing
  environment: {[key: string]: string}
  logGroupOutputKey?: string
  runtime: string
};

export const isValidRuntimeKey = (runtime: string): runtime is TestRuntimesKey => testRuntimeKeys.includes(runtime);

export const createStackWithLambdaFunction = (params: StackWithLambdaFunctionOptions): Stack => {
  
  const stack = new Stack(params.app, params.stackName);
  const testFunction = new lambda.NodejsFunction(stack, `testFunction`, {
    functionName: params.functionName,
    entry: params.functionEntry,
    tracing: params.tracing,
    environment: params.environment,
    runtime: TEST_RUNTIMES[params.runtime as TestRuntimesKey],
  });

  if (params.logGroupOutputKey) {
    new CfnOutput(stack, params.logGroupOutputKey, {
      value: testFunction.logGroup.logGroupName,
    });
  }
  
  return stack;
};

export const generateUniqueName = (name_prefix: string, uuid: string, runtime: string, testName: string): string => 
  `${name_prefix}-${runtime}-${testName}-${uuid}`.substring(0, 64);

export const deployStack = async (stackArtifact: CloudFormationStackArtifact ): Promise<{[name:string]: string}> => {
  const sdkProvider = await SdkProvider.withAwsCliCompatibleDefaults({
    profile: process.env.AWS_PROFILE,
  });
  const cloudFormation = new CloudFormationDeployments({ sdkProvider });

  // WHEN lambda function is deployed
  const result = await cloudFormation.deployStack({
    stack: stackArtifact,
    quiet: true,
  });

  return result.outputs;
};

export const invokeFunction = async (functionName: string, times: number = 1, invocationMode: 'PARALLEL' | 'SEQUENTIAL' = 'PARALLEL'): Promise<InvocationLogs[]> => {
  const invocationLogs: InvocationLogs[] = [];

  const promiseFactory = () : Promise<void> => {
    const invokePromise = lambdaClient
      .invoke({
        FunctionName: functionName,
        LogType: 'Tail', // Wait until execution completes and return all logs
      })
      .promise()
      .then((response) => {
        if (response?.LogResult) {
          invocationLogs.push(new InvocationLogs(response?.LogResult));
        } else {
          throw new Error('No LogResult field returned in the response of Lambda invocation. This should not happen.');
        }
      });

    return invokePromise;
  };
  
  const promiseFactories = Array.from({ length: times }, () => promiseFactory );
  const invocation = invocationMode == 'PARALLEL'
    ? Promise.all(promiseFactories.map(factory => factory()))
    : chainPromises(promiseFactories);
  await invocation;

  return invocationLogs; 
};

export const destroyStack = async (app: App, stack: Stack): Promise<void> => {
  const stackArtifact = app.synth().getStackByName(stack.stackName);

  const sdkProvider = await SdkProvider.withAwsCliCompatibleDefaults({
    profile: process.env.AWS_PROFILE,
  });
  const cloudFormation = new CloudFormationDeployments({ sdkProvider });

  await cloudFormation.destroyStack({
    stack: stackArtifact,
    quiet: true,
  });
};

const chainPromises = async (promiseFactories: (() => Promise<void>)[]) : Promise<void> => {
  let chain = Promise.resolve();
  promiseFactories.forEach(factory => chain = chain.then(factory));

  return chain;
};
