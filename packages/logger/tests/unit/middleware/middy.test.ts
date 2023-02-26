/**
 * Test Logger middleware
 *
 * @group unit/logger/all
 */

import { ContextExamples as dummyContext, Events as dummyEvent } from '@aws-lambda-powertools/commons';
import { ConfigServiceInterface, EnvironmentVariablesService } from '../../../src/config';
import { injectLambdaContext } from '../../../src/middleware/middy';
import { Logger } from './../../../src';
import middy from '@middy/core';
import { PowertoolLogFormatter } from '../../../src/formatter';
import { Console } from 'console';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

describe('Middy middleware', () => {

  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext.helloworldContext;
  const event = dummyEvent.Custom.CustomEvent;

  beforeEach(() => {
    jest.resetModules();
    dateSpy.mockClear();
    jest.spyOn(process.stdout, 'write').mockImplementation(() => null as unknown as boolean);
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('injectLambdaContext', () => {

    describe('Feature: add context data', () => {

      test('when a logger object is passed, it adds the context to the logger instance', async () => {

        // Prepare
        const logger = new Logger();
        const handler = middy((): void => {
          logger.info('This is an INFO log with some context');
        }).use(injectLambdaContext(logger));

        // Act
        await handler(event, context);

        // Assess
        expect(logger).toEqual(expect.objectContaining({
          logsSampled: false,
          persistentLogAttributes: {},
          powertoolLogData: {
            sampleRateValue: undefined,
            awsRegion: 'eu-west-1',
            environment: '',
            lambdaContext: {
              awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
              coldStart: true,
              functionName: 'foo-bar-function',
              functionVersion: '$LATEST',
              invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
              memoryLimitInMB: 128,
            },
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 'DEBUG',
          logFormatter: expect.any(PowertoolLogFormatter),
        }));

      });

      test('when a logger array is passed, it adds the context to all logger instances', async () => {

        // Prepare
        const logger = new Logger();
        const anotherLogger = new Logger();
        const handler = middy((): void => {
          logger.info('This is an INFO log with some context');
          anotherLogger.info('This is an INFO log with some context');
        }).use(injectLambdaContext([ logger, anotherLogger ]));

        // Act
        await handler(event, context);

        // Assess
        const expectation = expect.objectContaining({
          logsSampled: false,
          persistentLogAttributes: {},
          powertoolLogData: {
            sampleRateValue: undefined,
            awsRegion: 'eu-west-1',
            environment: '',
            lambdaContext: {
              awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
              coldStart: true,
              functionName: 'foo-bar-function',
              functionVersion: '$LATEST',
              invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
              memoryLimitInMB: 128,
            },
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 'DEBUG',
          logFormatter: expect.any(PowertoolLogFormatter),
          console: expect.any(Console),
        });
        expect(logger).toEqual(expectation);
        expect(anotherLogger).toEqual(expectation);

      });

    });

  });

  describe('Feature: clear state', () => {

    test('when enabled, the persistent log attributes added within the handler scope are removed after the invocation ends', async () => {

      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
          biz: 'baz'
        }
      });

      const handler = middy((): void => {
        // Only add these persistent for the scope of this lambda handler
        logger.appendKeys({
          details: { user_id: '1234' }
        });
        logger.debug('This is a DEBUG log with the user_id');
        logger.debug('This is another DEBUG log with the user_id');
      }).use(injectLambdaContext(logger, { clearState: true }));
      const persistentAttribsBeforeInvocation = { ...logger.getPersistentLogAttributes() };
      
      // Act
      await handler(event, context);
      
      // Assess
      const persistentAttribsAfterInvocation = { ...logger.getPersistentLogAttributes() };
      expect(persistentAttribsBeforeInvocation).toEqual({
        foo: 'bar',
        biz: 'baz'
      });
      expect(persistentAttribsAfterInvocation).toEqual(persistentAttribsBeforeInvocation);

    });

    test('when enabled, the persistent log attributes added within the handler scope are removed after the invocation ends even if an error is thrown', async () => {

      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
          biz: 'baz'
        }
      });
      const handler = middy((): void => {
        // Only add these persistent for the scope of this lambda handler
        logger.appendKeys({
          details: { user_id: '1234' }
        });
        logger.debug('This is a DEBUG log with the user_id');
        logger.debug('This is another DEBUG log with the user_id');

        throw new Error('Unexpected error occurred!');
      }).use(injectLambdaContext(logger, { clearState: true }));
      const persistentAttribsBeforeInvocation = { ...logger.getPersistentLogAttributes() };
      
      // Act & Assess
      await expect(handler(event, context))
        .rejects.toThrow();
      const persistentAttribsAfterInvocation = { ...logger.getPersistentLogAttributes() };
      expect(persistentAttribsBeforeInvocation).toEqual({
        foo: 'bar',
        biz: 'baz'
      });
      expect(persistentAttribsAfterInvocation).toEqual(persistentAttribsBeforeInvocation);

    });

  });

  describe('Feature: log event', () => {

    test('when enabled, it logs the event', async () => {

      // Prepare
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
      const handler = middy((): void => {
        logger.info('This is an INFO log with some context');
      }).use(injectLambdaContext(logger , { logEvent: true }));

      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'Lambda invocation event',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        event: {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3',
        }
      }));

    });

    test('when enabled, while also having a custom configService, it logs the event', async () => {

      // Prepare
      const configService: ConfigServiceInterface = {
        get(name: string): string {
          return `a-string-from-${name}`;
        },
        getCurrentEnvironment(): string {
          return 'dev';
        },
        getLogEvent(): boolean {
          return true;
        },
        getLogLevel(): string {
          return 'INFO';
        },
        getSampleRateValue(): number | undefined {
          return undefined;
        },
        getServiceName(): string {
          return 'my-backend-service';
        },
        isDevMode(): boolean {
          return false;
        },
        isValueTrue(): boolean {
          return true;
        },
      };

      const logger = new Logger({
        customConfigService: configService,
      });
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
      const handler = middy((): void => {
        logger.info('This is an INFO log with some context');
      }).use(injectLambdaContext(logger , { logEvent: true }));
      
      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'Lambda invocation event',
        service: 'my-backend-service',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        event: {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3',
        }
      }));

    });

    test('when enabled via POWERTOOLS_LOGGER_LOG_EVENT env var, it logs the event', async () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
      const handler = middy((): void => {
        logger.info('This is an INFO log with some context');
      }).use(injectLambdaContext(logger));
      
      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'Lambda invocation event',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        event: {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3',
        }
      }));

    });

    test('when disabled in the middleware, but enabled via POWERTOOLS_LOGGER_LOG_EVENT env var, it still doesn\'t log the event', async () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
      const handler = middy((): void => {
        logger.info('This is an INFO log');
      }).use(injectLambdaContext(logger, { logEvent: false }));
      
      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'This is an INFO log',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      }));
    });

  });

});

