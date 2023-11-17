/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import {
  S3EventNotificationEventBridgeSchema,
  S3SqsEventNotificationSchema,
  S3Schema,
  S3ObjectLambdaEventSchema,
} from '../../../src/schemas/s3.js';
import { loadExampleEvent } from './utils.js';

describe('S3 ', () => {
  it('should parse s3 event', () => {
    const s3Event = loadExampleEvent('s3Event.json');
    expect(S3Schema.parse(s3Event)).toEqual(s3Event);
  });

  it('should parse s3 event bridge notification event created', () => {
    const s3EventBridgeNotificationObjectCreatedEvent = loadExampleEvent(
      's3EventBridgeNotificationObjectCreatedEvent.json'
    );
    expect(
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectCreatedEvent
      )
    ).toEqual(s3EventBridgeNotificationObjectCreatedEvent);
  });

  it('should parse s3 event bridge notification event detelted', () => {
    const s3EventBridgeNotificationObjectDeletedEvent = loadExampleEvent(
      's3EventBridgeNotificationObjectDeletedEvent.json'
    );
    expect(
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectDeletedEvent
      )
    ).toEqual(s3EventBridgeNotificationObjectDeletedEvent);
  });
  it('should parse s3 event bridge notification event expired', () => {
    const s3EventBridgeNotificationObjectExpiredEvent = loadExampleEvent(
      's3EventBridgeNotificationObjectExpiredEvent.json'
    );
    expect(
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectExpiredEvent
      )
    ).toEqual(s3EventBridgeNotificationObjectExpiredEvent);
  });

  it('should parse s3 sqs notification event', () => {
    const s3SqsEvent = loadExampleEvent('s3SqsEvent.json');
    expect(S3SqsEventNotificationSchema.parse(s3SqsEvent)).toEqual(s3SqsEvent);
  });

  it('should parse s3 event with decoded key', () => {
    const s3EventDecodedKey = loadExampleEvent('s3EventDecodedKey.json');
    expect(S3Schema.parse(s3EventDecodedKey)).toEqual(s3EventDecodedKey);
  });

  it('should parse s3 event delete object', () => {
    const s3EventDeleteObject = loadExampleEvent('s3EventDeleteObject.json');
    expect(S3Schema.parse(s3EventDeleteObject)).toEqual(s3EventDeleteObject);
  });

  it('should parse s3 event glacier', () => {
    const s3EventGlacier = loadExampleEvent('s3EventGlacier.json');
    expect(S3Schema.parse(s3EventGlacier)).toEqual(s3EventGlacier);
  });

  it('should parse s3 object event iam user', () => {
    const s3ObjectEventIAMUser = loadExampleEvent('s3ObjectEventIAMUser.json');
    expect(S3ObjectLambdaEventSchema.parse(s3ObjectEventIAMUser)).toEqual(
      s3ObjectEventIAMUser
    );
  });

  it('should parse s3 object event temp credentials', () => {
    // ignore any because we don't want typed json
    const s3ObjectEventTempCredentials = loadExampleEvent(
      's3ObjectEventTempCredentials.json'
    ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const parsed = S3ObjectLambdaEventSchema.parse(
      s3ObjectEventTempCredentials
    );

    expect(parsed.userRequest).toEqual(
      s3ObjectEventTempCredentials.userRequest
    );
    expect(parsed.getObjectContext).toEqual(
      s3ObjectEventTempCredentials.getObjectContext
    );
    expect(parsed.configuration).toEqual(
      s3ObjectEventTempCredentials.configuration
    );
    expect(parsed.userRequest).toEqual(
      s3ObjectEventTempCredentials.userRequest
    );
    expect(
      parsed.userIdentity?.sessionContext?.attributes.mfaAuthenticated
    ).toEqual(false);
  });
});
