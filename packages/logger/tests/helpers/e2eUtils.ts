// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CloudFormationStackArtifact } from '@aws-cdk/cx-api';
import { SdkProvider } from 'aws-cdk/lib/api/aws-auth';
import { CloudFormationDeployments } from 'aws-cdk/lib/api/cloudformation-deployments';
import { App, CfnOutput, Stack } from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as AWS from 'aws-sdk';

import { InvocationLogs } from "./InvocationLog";

const lambdaClient = new AWS.Lambda();

export type StackWithLambdaFunctionOptions  = {
  app: App;
  stackName: string;
  functionName: string;
  functionEntry: string;
  environment: {[key: string]: string};
  logGroupOutputKey: string; 
}

export const createStackWithLambdaFunction = (params: StackWithLambdaFunctionOptions): Stack => {
  
  const stack = new Stack(params.app, params.stackName);
  const testFunction = new lambda.NodejsFunction(stack, `testFunction`, {
    functionName: params.functionName,
    entry: params.functionEntry,
    environment: params.environment,
  });

  new CfnOutput(stack, params.logGroupOutputKey, {
    value: testFunction.logGroup.logGroupName,
  });
  return stack;
}

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
}

export const invokeFunction = async (functionName: string, times: number = 1): Promise<InvocationLogs[]> => {
  let invocationLogs: InvocationLogs[] = [];
  let promises = [];
    
  for (let i = 0; i < times; i++) {
    const invokePromise = lambdaClient
      .invoke({
        FunctionName: functionName,
        LogType: 'Tail', // Wait until execution completes and return all logs
      })
      .promise()
      .then((response) => {
        invocationLogs.push(new InvocationLogs(response?.LogResult!));
      });
    promises.push(invokePromise);
  }
  await Promise.all(promises)

  return invocationLogs; 
}


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
}
