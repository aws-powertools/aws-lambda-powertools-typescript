/**
 * Test built-in API Gateway HTTP API (v2) schemas
 *
 * @group unit/parser/schema/apigwv2
 */
import {
  APIGatewayProxyEventV2Schema,
  APIGatewayRequestAuthorizerEventV2Schema,
} from '../../../src/schemas/index.js';
import { getTestEvent } from './utils.js';

describe('API Gateway HTTP (v2) Schemas', () => {
  const eventsPath = 'apigw-http';

  describe('APIGatewayProxyEventV2Schema', () => {
    it('should throw when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() => APIGatewayProxyEventV2Schema.parse(event)).toThrow();
    });

    it('should parse an event with no authorizer', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'no-auth' });

      // Act
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('should parse an event with a lambda authorizer', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'lambda-authorizer-auth',
      });

      // Act
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('should parse an event with a JWT authorizer', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'jwt-authorizer-auth',
      });

      // Act
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('should parse an event with an IAM authorizer', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'iam-auth',
      });

      // Act
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
  });

  describe('APIGatewayRequestAuthorizerEventV2Schema', () => {
    it('should throw when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() =>
        APIGatewayRequestAuthorizerEventV2Schema.parse(event)
      ).toThrow();
    });

    it('should parse the authorizer event', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'authorizer-request',
      });

      // Act
      const parsedEvent = APIGatewayRequestAuthorizerEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
  });

  /* it('should parse api gateway v2 event', () => {
    const apiGatewayProxyV2Event = TestEvents.apiGatewayProxyV2Event;

    expect(APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event)).toEqual(
      apiGatewayProxyV2Event
    );
  });
  it('should parse api gateway v2 event with GET method', () => {
    const apiGatewayProxyV2Event_GET = TestEvents.apiGatewayProxyV2Event_GET;
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event_GET)
    ).toEqual(apiGatewayProxyV2Event_GET);
  });
  it('should parse api gateway v2 event with path trailing slash', () => {
    const apiGatewayProxyV2EventPathTrailingSlash =
      TestEvents.apiGatewayProxyV2EventPathTrailingSlash;

    expect(
      APIGatewayProxyEventV2Schema.parse(
        apiGatewayProxyV2EventPathTrailingSlash
      )
    ).toEqual(apiGatewayProxyV2EventPathTrailingSlash);
  });
  it('should parse api gateway v2 event with iam', () => {
    const apiGatewayProxyV2IamEvent = TestEvents.apiGatewayProxyV2IamEvent;

    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2IamEvent)
    ).toEqual(apiGatewayProxyV2IamEvent);
  });
  it('should parse api gateway v2 event with lambda authorizer', () => {
    const apiGatewayProxyV2LambdaAuthorizerEvent =
      TestEvents.apiGatewayProxyV2LambdaAuthorizerEvent;

    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2LambdaAuthorizerEvent)
    ).toEqual(apiGatewayProxyV2LambdaAuthorizerEvent);
  });
  it('should parse api gateway v2 event with other get event', () => {
    const apiGatewayProxyV2OtherGetEvent =
      TestEvents.apiGatewayProxyV2OtherGetEvent;

    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2OtherGetEvent)
    ).toEqual(apiGatewayProxyV2OtherGetEvent);
  });
  it('should parse api gateway v2 event with schema middleware', () => {
    const apiGatewayProxyV2SchemaMiddlewareValidEvent =
      TestEvents.apiGatewayProxyV2SchemaMiddlewareValidEvent;

    expect(
      APIGatewayProxyEventV2Schema.parse(
        apiGatewayProxyV2SchemaMiddlewareValidEvent
      )
    ).toEqual(apiGatewayProxyV2SchemaMiddlewareValidEvent);
  }); */
});
