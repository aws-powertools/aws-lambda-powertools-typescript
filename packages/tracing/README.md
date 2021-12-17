# `tracer`

Tracer is an opinionated thin wrapper for [AWS X-Ray SDK for Node.js](https://github.com/aws/aws-xray-sdk-node).

Tracing data can be visualized through AWS X-Ray Console.

## Key features
* Auto capture cold start as annotation, and responses or full exceptions as metadata
* Auto-disable when not running in AWS Lambda environment
* Support tracing functions via decorators, middleware, and manual instrumentation
* Support tracing AWS SDK v2 and v3 via AWS X-Ray SDK for Node.js

## Usage

For more usage examples, see [our documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer/).

### Functions usage with middlewares

If you use function-based Lambda handlers you can use the [captureLambdaHanlder()](./_aws_lambda_powertools_tracer.Tracer.html) middy middleware to automatically:
* handle the subsegment lifecycle 
* add the `ColdStart` annotation
* add the function response as metadata
* add the function error as metadata (if any)
 
```typescript
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import middy from '@middy/core';
 
const tracer = new Tracer({ serviceName: 'my-service' });
 
export const handler = middy(async (_event: any, _context: any) => {
    ...
}).use(captureLambdaHandler(tracer));
```

### Object oriented usage with decorators

If instead you use TypeScript Classes to wrap your Lambda handler you can use the [@tracer.captureLambdaHanlder()](./_aws_lambda_powertools_tracer.Tracer.html#captureLambdaHanlder) decorator to automatically:
* handle the subsegment lifecycle 
* add the `ColdStart` annotation
* add the function response as metadata
* add the function error as metadata (if any)

```typescript
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'my-service' });

class Lambda {
    @tracer.captureLambdaHanlder()
    public handler(event: any, context: any) {
        ...
    }
}

export const handlerClass = new Lambda();
export const handler = handlerClass.handler; 
```

### Functions usage with manual instrumentation

If you prefer to manually instrument your Lambda handler you can use the methods in the tracer class directly.

```typescript
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'my-service' });

export const handler = async (_event: any, context: any) => {
    const segment = tracer.getSegment(); // This is the facade segment (the one that is created by AWS Lambda)
    // Create subsegment for the function
    const handlerSegment = segment.addNewSubsegment(`## ${context.functionName}`);
    // TODO: expose tracer.annotateColdStart()
    this.putAnnotation('ColdStart', tracer.isColdStart());

    let res;
    try {
        res = ...
        // Add the response as metadata 
        tracer.putMetadata(`${context.functionName} response`, res);
    } catch (err) {
        // Add the error as metadata
        handlerSegment.addError(err as Error, false);
    }
 
    // Close subsegment (the AWS Lambda one is closed automatically)
    handlerSegment.close();
 
    return res;
}
```