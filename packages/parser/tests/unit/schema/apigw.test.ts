/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { loadExampleEvent } from './utils.js';
import { APIGatewayProxyEventSchema } from '../../../src/schemas/apigw.js';

describe('APIGateway ', () => {
  it('should parse api gateway event', () => {
    const apiGatewayProxyEvent = loadExampleEvent('apiGatewayProxyEvent.json');
    expect(APIGatewayProxyEventSchema.parse(apiGatewayProxyEvent)).toEqual(
      apiGatewayProxyEvent
    );
  });
  it('should parse api gateway authorizer request event', () => {
    const apiGatewayAuthorizerRequestEvent = loadExampleEvent(
      'apiGatewayAuthorizerRequestEvent.json'
    );
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewayAuthorizerRequestEvent)
    ).toEqual(apiGatewayAuthorizerRequestEvent);
  });
  it('should parse schema middleware invalid event', () => {
    const apiGatewaySchemaMiddlewareInvalidEvent = loadExampleEvent(
      'apiGatewaySchemaMiddlewareInvalidEvent.json'
    );
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewaySchemaMiddlewareInvalidEvent)
    ).toEqual(apiGatewaySchemaMiddlewareInvalidEvent);
  });
  it('should parse schema middleware valid event', () => {
    const apiGatewaySchemaMiddlewareValidEvent = loadExampleEvent(
      'apiGatewaySchemaMiddlewareValidEvent.json'
    );
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewaySchemaMiddlewareValidEvent)
    ).toEqual(apiGatewaySchemaMiddlewareValidEvent);
  });
  it('should parse proxy event with no version auth', () => {
    const apiGatewayProxyEvent_noVersionAuth = loadExampleEvent(
      'apiGatewayProxyEvent_noVersionAuth.json'
    );
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewayProxyEvent_noVersionAuth)
    ).toEqual(apiGatewayProxyEvent_noVersionAuth);
  });
  it('should parse proxy event with another path', () => {
    const apiGatewayProxyEventAnotherPath = loadExampleEvent(
      'apiGatewayProxyEventAnotherPath.json'
    );
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewayProxyEventAnotherPath)
    ).toEqual(apiGatewayProxyEventAnotherPath);
  });
  it('should parse proxy event with path trailing slash', () => {
    const apiGatewayProxyEventPathTrailingSlash = loadExampleEvent(
      'apiGatewayProxyEventPathTrailingSlash.json'
    );
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewayProxyEventPathTrailingSlash)
    ).toEqual(apiGatewayProxyEventPathTrailingSlash);
  });
  it('should parse other proxy event', () => {
    const apiGatewayProxyOtherEvent = loadExampleEvent(
      'apiGatewayProxyOtherEvent.json'
    );
    expect(APIGatewayProxyEventSchema.parse(apiGatewayProxyOtherEvent)).toEqual(
      apiGatewayProxyOtherEvent
    );
  });
  it('should throw error when event is not a valid proxy event', () => {
    const event = {
      resource: '/',
      path: '/',
      httpMethod: 'GET',
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      body: 'Foo!',
      requestContext: {
        accountId: '1234',
        apiId: 'myApi',
        httpMethod: 'GET',
        identity: {
          sourceIp: '127.0.0.1',
        },
        path: '/',
        protocol: 'Https',
        requestId: '1234',
        requestTime: '2018-09-07T16:20:46Z',
        requestTimeEpoch: 1536992496000,
        resourcePath: '/',
        stage: 'test',
        eventType: 'DISCONNECT',
        messageId: 'messageId',
      },
    };
    expect(() => APIGatewayProxyEventSchema.parse(event)).toThrow();
  });
});
