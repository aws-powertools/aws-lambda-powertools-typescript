---
title: Upgrade guide
description: Guide to update between major Powertools for AWS Lambda (TypeScript) versions
---

## Migrate from v1 to v2


V2 is focused on official support for ESM (ECMAScript modules). We've made other minimal breaking changes to make your transition to v2 as smooth as possible.

### Quick summary


| Area                  | Change                                                                                                                         | Code change required |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| **ESM support**       | Added ESM support via dual CommonJS and ESM bundling, enabling top-level `await` and tree-shaking.                             | -                    |
| **Middy.js **         | Updated import path for Middy.js middlewares to leverage subpath exports - i.e. `@aws-lambda-powertools/tracer/middleware`.    | Yes                  |
| **Types imports**     | Updated import path for TypeScript types to leverage subpath exports - i.e. `@aws-lambda-powertools/logger/types`.             | Yes                  |
| **Logger**            | Changed [log sampling](./core/logger.md#sampling-logs) to dynamically switch log level to `DEBUG` on a percentage of requests. | -                    |
| **Logger**            | Updated [custom log formatter](#custom-log-formatter) to include standard as well as persistent keys.                          | Yes                  |
| **Logger and Tracer** | Removed deprecated `createLogger` and `createTracer` helper functions in favor of direct instantiation.                        | Yes                  |

### First steps

Before you start, we suggest making a copy of your current working project or create a new git branch.

1. Upgrade Node.js to v16 or higher, Node.js v20 is recommended.
2. Ensure that you have the latest Powertools for AWS Lambda (TypeScript) version via [Lambda Layer](./index.md#lambda-layer) or npm.
3. Review the following sections to confirm whether they apply to your codebase.

## ESM support

With support for ES Modules in v2, you can now use `import` instead of `require` syntax.

This is especially useful when you want to run asynchronous code during the initialization phase by using top-level `await`.

```typescript title="top-level await example in v2"
import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

// This code will run during the initialization phase of your Lambda function
const myApiKey = await getSecret('my-api-key', { transform: 'json' });

export const handler = async (_event: unknown, _context: unknown) => {
    // ...
};
```

In v2, we improved tree-shaking support to help you reduce your function bundle size. We would love to hear your feedback on further improvements we could make.

While we recommend using ES Modules, we understand that this change might not be possible for everyone. If you're unable to use ES Modules, you can continue to use the `require` syntax to import the package. Powertools for AWS Lambda (TypeScript) will continue to support this syntax by shipping CommonJS modules alongside ES Modules.

In some cases, even when opting for ES Modules, you might still need to use the `require` syntax to import a package. For example, if you're using a package that doesn't support ES Modules, or if one of your transitive dependencies is using the `require` syntax like it's the case for `@aws-lambda-powertools/tracer` which relies on the AWS X-Ray SDK for Node.js. In these cases, you can still use ES Modules for the rest of your codebase and set a special build flag to tell your bundler to inject a banner at the top of the file to use the `require` syntax for the specific package.

=== "With AWS CDK"

    ```typescript hl_lines="15 20-21"
    import { Stack, type StackProps } from 'aws-cdk-lib';
    import { Construct } from 'constructs';
    import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
    import { Runtime } from 'aws-cdk-lib/aws-lambda';

    export class MyStack extends Stack {
      public constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const handler = new NodejsFunction(this, 'helloWorldFunction', {
          runtime: Runtime.NODEJS_20_X,
          handler: 'handler',
          entry: 'src/index.ts',
          bundling: {
            format: OutputFormat.ESM,
            minify: true,
            esbuildArgs: {
              "--tree-shaking": "true",
            },
            banner: 
              "import { createRequire } from 'module';const require = createRequire(import.meta.url);", // (1)!
          },
        });
      }
    }
    ```
    
    1. `esbuild` will include this arbitrary code at the top of your bundle to maximize CommonJS compatibility _(`require` keyword)_.

=== "With AWS SAM"

    ```yaml hl_lines="14 17-18"
    Transform: AWS::Serverless-2016-10-31
    Resources:
      HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs20.x
          Handler: src/index.handler
        Metadata:
          BuildMethod: esbuild
          BuildProperties:
            Minify: true
            Target: 'ES2020'
            Sourcemap: true
            Format: esm
            EntryPoints:
              - src/index.ts
            Banner:
              js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);"  # (1)!
 
    ```

    1. `esbuild` will include this arbitrary code at the top of your bundle to maximize CommonJS compatibility _(`require` keyword)_.

## Scoped imports

### Middy.js middleware imports

???+ note "Disregard if you are not using Middy.js middlewares."
    In v2, we've added support for subpath exports. This means if you don't import Middy.js middlewares, you will benefit from a smaller bundle size.

In v1, you could import Middy.js middlewares from the default export of a package _(e.g., `logger`)_. For example, you'd import `injectLambdaContext` Logger middleware from `@aws-lambda-powertools/logger`.

In v2, you can now import only the Middy.js middlewares you want to use from a subpath export, _e.g., `@aws-lambda-powertools/logger/middleware`_, leading to a smaller bundle size.

### Types imports

In v1, you could import package types from each package under `/lib`, for example `@aws-lambda-powertools/logger/lib/types`.

In v2, you can now directly import from the `types` subpath export, e.g., `@aws-lambda-powertools/logger/types`. This will optimize your bundle size, standardize types import across packages, future-proofing growth.

## Logger

### Log sampling

!!! note "Disregard if you are not using the [log sampling feature](./core/logger.md#sampling-logs)."

In v1, log sampling implementation was inconsistent from other Powertools for AWS Lambda languages _(Python, .NET, and Java)_. 

In v2, we changed these behaviors for consistency across languages:

| Behavior                | v1                                                           | v2                                            |
| ----------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Log Level               | Log level remains unchanged but any log statement is printed | Log level changes to `DEBUG`                  |
| Log sampling indication | No indication                                                | Debug message indicates sampling is in effect |

Logger `sampleRateValue` **continues** to determine the percentage of concurrent/cold start invocations that logs will be sampled, _e.g., log level set to `DEBUG`_.

### Custom log formatter

!!! note "Disregard if you are not customizing log output with a [custom log formatter](./core/logger.md#custom-log-formatter-bring-your-own-formatter)."

In v1, `Logger` combined both [standard]((./core/logger.md#standard-structured-keys)) and [custom keys](./core/logger.md#appending-persistent-additional-log-keys-and-values) as a single argument, _e.g., `formatAttributes(attributes: UnformattedAttributes)`_. It expected a plain object with keys and values you wanted in the final log output.

In v2, you have more control over **standard** (`attributes`) and **custom keys** (`additionalLogAttributes`) in the `formatAttributes` method. Also, you now return a `LogItem` object to increase type safety when defining the final log output.

=== "Before"

    ```typescript hl_lines="5 8"
    import { LogFormatter } from '@aws-lambda-powertools/logger';
    import {
      LogAttributes,
      UnformattedAttributes,
    } from '@aws-lambda-powertools/logger/lib/types';

    class MyCompanyLogFormatter extends LogFormatter {
      public formatAttributes(attributes: UnformattedAttributes): LogAttributes {
        return {
          message: attributes.message,
          service: attributes.serviceName,
          environment: attributes.environment,
          awsRegion: attributes.awsRegion,
          correlationIds: {
            awsRequestId: attributes.lambdaContext?.awsRequestId,
            xRayTraceId: attributes.xRayTraceId,
          },
          lambdaFunction: {
            name: attributes.lambdaContext?.functionName,
            arn: attributes.lambdaContext?.invokedFunctionArn,
            memoryLimitInMB: attributes.lambdaContext?.memoryLimitInMB,
            version: attributes.lambdaContext?.functionVersion,
            coldStart: attributes.lambdaContext?.coldStart,
          },
          logLevel: attributes.logLevel,
          timestamp: this.formatTimestamp(attributes.timestamp),
          logger: {
            sampleRateValue: attributes.sampleRateValue,
          },
        };
      }
    }

    export { MyCompanyLogFormatter };
    ```

=== "After"

    ```typescript hl_lines="1-2 5-8"
    import { LogFormatter, LogItem } from '@aws-lambda-powertools/logger';
    import type { LogAttributes, UnformattedAttributes } from '@aws-lambda-powertools/logger/types';

    class MyCompanyLogFormatter extends LogFormatter {
      public formatAttributes(
        attributes: UnformattedAttributes,
        additionalLogAttributes: LogAttributes  // (1)!
      ): LogItem {  // (2)!
        const baseAttributes = {
            message: attributes.message,
            service: attributes.serviceName,
            environment: attributes.environment,
            awsRegion: attributes.awsRegion,
            correlationIds: {
                awsRequestId: attributes.lambdaContext?.awsRequestId,
                xRayTraceId: attributes.xRayTraceId,
            },
            lambdaFunction: {
                name: attributes.lambdaContext?.functionName,
                arn: attributes.lambdaContext?.invokedFunctionArn,
                memoryLimitInMB: attributes.lambdaContext?.memoryLimitInMB,
                version: attributes.lambdaContext?.functionVersion,
                coldStart: attributes.lambdaContext?.coldStart,
            },
            logLevel: attributes.logLevel,
            timestamp: this.formatTimestamp(attributes.timestamp),
            logger: {
                sampleRateValue: attributes.sampleRateValue,
            },
        };

        // Create a new LogItem with the base attributes
        const logItem = new LogItem({ attributes: baseAttributes });

        // Merge additional attributes
        logItem.addAttributes(additionalLogAttributes); // (3)!

        return logItem;
      }
    }

    export { MyCompanyLogFormatter };
    ```

    1. This new argument contains all [your custom keys](./core/logger.md#appending-persistent-additional-log-keys-and-values).
    2. `LogItem` is the new return object instead of a plain object.
    3. If you prefer adding at the initialization, use: <br/><br/> **`LogItem({persistentAttributes: additionalLogAttributes, attributes: baseAttributes})`**

## Helper functions

We removed the deprecated `createLogger` and `createTracer` heper functions.

```typescript
import { createLogger } from '@aws-lambda-powertools/logger';
import { createTracer } from '@aws-lambda-powertools/tracer';

const logger = createLogger({ logLevel: 'info' });
const tracer = createTracer({ serviceName: 'my-service' });
```

You can migrate to instantiating the `Logger` and `Tracer` classes directly with no additional changes.

```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

const logger = new Logger({ logLevel: 'info' });
const tracer = new Tracer({ serviceName: 'my-service' });
```
