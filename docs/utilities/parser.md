---
title: Parser (zod)
descrition: Utility
---


???+ warning
**This utility is currently released as beta developer preview** and is intended strictly for feedback and testing purposes **and not for production workloads**. The version and all future versions tagged with the `-beta` suffix should be treated as not stable. Up until before the [General Availability release](https://github.com/aws-powertools/powertools-lambda-typescript/milestone/16) we might introduce significant breaking changes and improvements in response to customers feedback.

This utility provides data validation and parsing using [zod](https://zod.dev).

## Key features

* Define data schema as zod schema, then parse, validate and extract only what you want
* Built-in envelopes to unwrap and validate popular event sources payloads
* Extend and customize envelopes to fit your needs
* Available for middy middleware and TypeScript method decorators

## Getting started

### Install

```bash
npm install @aws-lambda-powertools/parser zod
```

This utility supports zod v3.0.0 and above.

## Define schema

You can define your schema using zod:

```typescript
--8<-- "docs/snippets/parser/schema.ts"
```

This is a schema for order and oder items using zod. 
You can create more complex schemas using zod, such as nested objects, arrays, unions, etc. see [zod documentation](https://zod.dev) for more details.

## Parse events

You can parse inbound events using `parser` decorator or middy middleware. 
Both are also able to parse either an object or JSON string as an input.

???+ note
    The decorator and middleware will replace the event object with the parsed schema if successful. This means you might be careful when nesting other decorators that expect event to have a specific structure.

=== "Middy middleware"
    ```typescript hl_lines="31"
    --8<-- "docs/snippets/parser/middy.ts"
    ```    

=== "Decorator" 
    ```typescript hl_lines="22"
    --8<-- "docs/snippets/parser/decorator.ts"
    ```

## Built-in schemas


Parser comes with the following built-in schemas:

| Model name                                    | Description                                                                           |
|-----------------------------------------------| ------------------------------------------------------------------------------------- |
| **AlbSchema**                                 | Lambda Event Source payload for Amazon Application Load Balancer                      |
| **APIGatewayProxyEventSchema**                | Lambda Event Source payload for Amazon API Gateway                                    |
| **APIGatewayProxyEventV2Schema**              | Lambda Event Source payload for Amazon API Gateway v2 payload                         |
| **BedrockAgentEventSchema**                   | Lambda Event Source payload for Bedrock Agents                                        |
| **CloudFormationCustomResourceCreateSchema**  | Lambda Event Source payload for AWS CloudFormation `CREATE` operation                 |
| **CloudFormationCustomResourceUpdateSchema**  | Lambda Event Source payload for AWS CloudFormation `UPDATE` operation                 |
| **CloudFormationCustomResourceDeleteSchema**  | Lambda Event Source payload for AWS CloudFormation `DELETE` operation                 |
| **CloudwatchLogsSchema**                      | Lambda Event Source payload for Amazon CloudWatch Logs                                |
| **DynamoDBStreamSchema**                      | Lambda Event Source payload for Amazon DynamoDB Streams                               |
| **EventBridgeSchema**                         | Lambda Event Source payload for Amazon EventBridge                                    |
| **KafkaMskEventSchema**                       | Lambda Event Source payload for AWS MSK payload                                       |
| **KafkaSelfManagedEventSchema**               | Lambda Event Source payload for self managed Kafka payload                            |
| **KinesisDataStreamSchema**                   | Lambda Event Source payload for Amazon Kinesis Data Streams                           |
| **KinesisFirehoseSchema**                     | Lambda Event Source payload for Amazon Kinesis Firehose                               |
| **KinesisFirehoseSqsSchema**                  | Lambda Event Source payload for SQS messages wrapped in Kinesis Firehose records      |
| **LambdaFunctionUrlSchema**                   | Lambda Event Source payload for Lambda Function URL payload                           |
| **S3EventNotificationEventBridgeSchema**      | Lambda Event Source payload for Amazon S3 Event Notification to EventBridge.          |
| **S3Schema**                                  | Lambda Event Source payload for Amazon S3                                             |
| **S3ObjectLambdaEvent**                       | Lambda Event Source payload for Amazon S3 Object Lambda                               |
| **S3SqsEventNotificationSchema**              | Lambda Event Source payload for S3 event notifications wrapped in SQS event (S3->SQS) |
| **SesSchema**                                 | Lambda Event Source payload for Amazon Simple Email Service                           |
| **SnsSchema**                                 | Lambda Event Source payload for Amazon Simple Notification Service                    |
| **SqsSchema**                                 | Lambda Event Source payload for Amazon SQS                                            |
| **VpcLatticeSchema**                          | Lambda Event Source payload for Amazon VPC Lattice                                    |
| **VpcLatticeV2Schema**                        | Lambda Event Source payload for Amazon VPC Lattice v2 payload                         |

### Extend built-in schemas

You can extend them to include your own schema, and yet have all other known fields parsed along the way.

=== "handler.ts"
    ```typescript hl_lines="20-22 27 30"
    --8<-- "docs/snippets/parser/extend.ts"
    ```

    1. Extend built-in `EventBridgeSchema` with your own detail schema
    2. Pass the extended schema to `parser` decorator or middy middleware
    3. `event` is validated including your custom schema and now available in your handler


=== "Example payload"

    ```json
    --8<-- "docs/snippets/parser/examplePayload.json"
    ```



## Envelopes

When trying to parse your payloads wrapped in a known structure, you might encounter the following situations:

* Your actual payload is wrapped around a known structure, for example Lambda Event Sources like EventBridge
* You're only interested in a portion of the payload, for example parsing the detail of custom events in EventBridge, or body of SQS records
* You can either solve these situations by creating a schema of these known structures, parsing them, then extracting and parsing a key where your payload is.

This can become difficult quite quickly. Parser simplifies the development through a feature named Envelope.
Envelopes can be used via envelope parameter available in both parse function and `parser` decorator.
Here's an example of parsing a schema found in an event coming from EventBridge, where all you want is what's inside the detail key.

=== "Decorator"
    ```typescript hl_lines="5 23"
    --8<-- "docs/snippets/parser/envelopeDecorator.ts"
    ```

    1. Pass `eventBridgeEnvelope` to `parser` decorator
    2. `event` is parsed and replaced as `Order` object

=== "Middy middleware"
    ```typescript hl_lines="5 32"
    --8<-- "docs/snippets/parser/envelopeMiddy.ts"
    ```

The envelopes are functions that take an event and the schema to parse, and return the result of the inner schema.
Depending on the envelope it can be something simple like extracting a key. 
We have also complex envelopes that parse the payload from a string, decode base64, uncompress gzip, etc.

### Built-in envelopes

Parser comes with the following built-in envelopes:

| Envelope name                 | Behaviour                                                                                                                                                                                                     |
| ----------------------------- | -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------   |
| **apiGatewayEnvelope**        | 1. Parses data using `APIGatewayProxyEventSchema`. <br/> 2. Parses `body` key using your schema and returns it.                                                                                               |
| **apiGatewayV2Envelope**      | 1. Parses data using `APIGatewayProxyEventV2Schema`. <br/> 2. Parses `body` key using your schema and returns it.                                                                                             |
| **cloudWatchEnvelope**        | 1. Parses data using `CloudwatchLogsSchema` which will base64 decode and decompress it. <br/> 2. Parses records in `message` key using your schema and return them in a list.                                 |
| **dynamoDBStreamEnvelope**    | 1. Parses data using `DynamoDBStreamSchema`. <br/> 2. Parses records in `NewImage` and `OldImage` keys using your schema. <br/> 3. Returns a list with a dictionary containing `NewImage` and `OldImage` keys |
| **eventBridgeEnvelope**       | 1. Parses data using `EventBridgeSchema`. <br/> 2. Parses `detail` key using your schema and returns it.                                                                                                      |
| **kafkaEnvelope**             | 1. Parses data using `KafkaRecordSchema`. <br/> 2. Parses `value` key using your schema and returns it.                                                                                                       |
| **kinesisEnvelope**           | 1. Parses data using `KinesisDataStreamSchema` which will base64 decode it. <br/> 2. Parses records in `Records` key using your schema and returns them in a list.                                            |
| **kinesisFirehoseEnvelope**   | 1. Parses data using `KinesisFirehoseSchema` which will base64 decode it. <br/> 2. Parses records in `Records` key using your schema and returns them in a list.                                              |
| **lambdaFunctionUrlEnvelope** | 1. Parses data using `LambdaFunctionUrlSchema`. <br/> 2. Parses `body` key using your schema and returns it.                                                                                                  |
| **snsEnvelope**               | 1. Parses data using `SnsSchema`. <br/> 2. Parses records in `body` key using your schema and return them in a list.                                                                                          |
| **snsSqsEnvelope**            | 1. Parses data using `SqsSchema`. <br/> 2. Parses SNS records in `body` key using `SnsNotificationSchema`. <br/> 3. Parses data in `Message` key using your schema and return them in a list.                 |
| **sqsEnvelope**               | 1. Parses data using `SqsSchema`. <br/> 2. Parses records in `body` key using your schema and return them in a list.                                                                                          |
| **vpcLatticeEnvelope**        | 1. Parses data using `VpcLatticeSchema`. <br/> 2. Parses `value` key using your schema and returns it.                                                                                                        |
| **vpcLatticeV2Envelope**      | 1. Parses data using `VpcLatticeSchema`. <br/> 2. Parses `value` key using your schema and returns it.                                                                                                        |


## Manual parsing

You can use built-in envelopes and schemas to parse the incoming events manually: 

=== "Manual parsing"
    ```typescript hl_lines="25 28"
    --8<-- "docs/snippets/parser/manual.ts"
    ```
    
    1. Use `EventBridgeSchema` to parse the event, the `details` fields will be parsed as a generic record.
    2. Use `eventBridgeEnvelope` with a combination of `orderSchema` to get `Order` object from the `details` field.


## Custom validation

Because Parser uses zod, you can use all the features of zod to validate your data.
For example, you can use `refine` to validate a field or a combination of fields:

=== "Custom validation"
    ```typescript hl_lines="13 18"
    --8<-- "docs/snippets/parser/refine.ts"
    ```

Zod provides a lot of other features and customization, see [zod documentation](https://zod.dev) for more details.






