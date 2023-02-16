import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  LayerVersion,
  Code,
  Runtime,
  CfnLayerVersionPermission
} from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export interface LayerPublisherStackProps extends StackProps {
  readonly layerName?: string
  readonly powerToolsPackageVersion?: string
  readonly ssmParameterLayerArn: string
}

export class LayerPublisherStack extends Stack {
  public readonly lambdaLayerVersion: LayerVersion;
  public constructor(scope: Construct, id: string, props: LayerPublisherStackProps) {
    super(scope, id, props);

    const { layerName, powerToolsPackageVersion } = props;

    console.log(`publishing layer ${layerName} version : ${powerToolsPackageVersion}`);

    this.lambdaLayerVersion = new LayerVersion(this, 'LambdaPowertoolsLayer', {
      layerVersionName: props?.layerName,
      description: `AWS Lambda Powertools for TypeScript version ${powerToolsPackageVersion}`,
      compatibleRuntimes: [
        Runtime.NODEJS_14_X,
        Runtime.NODEJS_16_X,
        Runtime.NODEJS_18_X
      ],
      code: Code.fromAsset('../tmp'),
    });

    const layerPermission = new CfnLayerVersionPermission(this, 'PublicLayerAccess', {
      action: 'lambda:GetLayerVersion',
      layerVersionArn: this.lambdaLayerVersion.layerVersionArn,
      principal: '*',
    });

    layerPermission.applyRemovalPolicy(RemovalPolicy.RETAIN);
    this.lambdaLayerVersion.applyRemovalPolicy(RemovalPolicy.RETAIN);

    new StringParameter(this, 'VersionArn', {
      parameterName: props.ssmParameterLayerArn,
      stringValue: this.lambdaLayerVersion.layerVersionArn,
    });
    new CfnOutput(this, 'LatestLayerArn', {
      value: this.lambdaLayerVersion.layerVersionArn,
      exportName: props?.layerName ?? `LambdaPowerToolsForTypeScriptLayerARN`,
    });
  }
}
