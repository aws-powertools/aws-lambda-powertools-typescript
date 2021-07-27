import { ConfigServiceInterface } from '../../src/config';
import { TracerOptions } from '../../types';
import { createTracer, Tracer } from './../../src';

describe('Helper: createLogger function', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('TracerOptions parameters', () => {
    test('when no tracer options are passed, returns a Tracer instance with the correct proprieties', () => {
      // Prepare
      const tracerOptions = undefined;

      // Act
      const tracer = createTracer(tracerOptions);

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(expect.objectContaining({
        tracingDisabled: false,
        serviceName: 'hello-world'
      }));
            
    });

    test('when all tracer options are passed, returns a Tracer instance with the correct properties', () => {

      // Prepare
      const tracerOptions = {
        disabled: true,
        serviceName: 'my-lambda-service'
      };

      // Act
      const tracer = createTracer(tracerOptions);

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(expect.objectContaining({
        tracingDisabled: true,
        serviceName: 'my-lambda-service'
      }));
    });

    test('when a custom serviceName is passed, returns a Tracer instance with the correct properties', () => {

      // Prepare
      const tracerOptions = {
        serviceName: 'my-lambda-service'
      };

      // Act
      const tracer = createTracer(tracerOptions);

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(expect.objectContaining({
        tracingDisabled: false,
        serviceName: 'my-lambda-service'
      }));
    });

    test('when a custom, but invalid, serviceName is passed, returns a Tracer instance with the correct properties', () => {

      // Prepare
      const tracerOptions = {
        serviceName: ''
      };

      // Act
      const tracer = createTracer(tracerOptions);

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(expect.objectContaining({
        tracingDisabled: false,
        serviceName: 'hello-world'
      }));
    });

    test('when (tracing) disabled is passed, returns a Tracer instance with the correct properties', () => {

      // Prepare
      const tracerOptions = {
        disabled: true
      };

      // Act
      const tracer = createTracer(tracerOptions);

      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(expect.objectContaining({
        tracingDisabled: true,
        serviceName: 'hello-world'
      }));
    });

    test('when a custom customConfigService is passed, returns a Logger instance with the correct proprieties', () => {

      const configService: ConfigServiceInterface = {
        get(name: string): string {
          return `a-string-from-${name}`;
        },
        getTracingDisabled(): string {
          return 'true';
        },
        getTracingCaptureResponse(): string {
          return 'false';
        },
        getTracingCaptureError(): string {
          return 'false';
        },
        getServiceName(): string {
          return 'my-backend-service';
        }
      };
      // Prepare
      const tracerOptions:TracerOptions = {
        customConfigService: configService
      };
      
      // Act
      const tracer = createTracer(tracerOptions);
      
      // Assess
      expect(tracer).toBeInstanceOf(Tracer);
      expect(tracer).toEqual(expect.objectContaining({
        customConfigService: configService,
        tracingDisabled: true,
        serviceName: 'my-backend-service'
      }));
    });
  });

  describe('Environment Variables configs', () => {

    test('when AWS_SAM_LOCAL environment variable is set, tracing is disabled', () => {
      // Prepare
      process.env.AWS_SAM_LOCAL = 'true';

      // Act
      const tracer = createTracer();

      // Assess
      expect(tracer).toEqual(expect.objectContaining({
        tracingDisabled: true,
      }));
      delete process.env.AWS_SAM_LOCAL;
    });

    test('when AWS_CHALICE_CLI_MODE environment variable is set, tracing is disabled', () => {
      // Prepare
      process.env.AWS_CHALICE_CLI_MODE = 'true';

      // Act
      const tracer = createTracer();

      // Assess
      expect(tracer).toEqual(expect.objectContaining({
        tracingDisabled: true,
      }));
      delete process.env.AWS_CHALICE_CLI_MODE;
    });

    test('when POWERTOOLS_TRACE_DISABLED environment variable is set, a tracer with tracing disabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACE_DISABLED = 'true';

      // Act
      const tracer = createTracer();

      // Assess
      expect(tracer).toEqual(expect.objectContaining({
        tracingDisabled: true,
      }));
      delete process.env.POWERTOOLS_TRACE_DISABLED;
    });

    test('when POWERTOOLS_SERVICE_NAME environment variable is set, a tracer with the correct serviceName is returned', () => {
      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = 'my-backend-service';

      // Act
      const tracer = createTracer();

      // Assess
      expect(tracer).toEqual(expect.objectContaining({
        serviceName: 'my-backend-service'
      }));
      delete process.env.POWERTOOLS_SERVICE_NAME;
    });

    test('when POWERTOOLS_SERVICE_NAME environment variable is set to invalid value, a tracer default serviceName is returned', () => {
      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = '';

      // Act
      const tracer = createTracer();

      // Assess
      expect(tracer).toEqual(expect.objectContaining({
        serviceName: 'serviceUndefined'
      }));
      delete process.env.POWERTOOLS_SERVICE_NAME;
    });

    test('when POWERTOOLS_TRACER_CAPTURE_RESPONSE environment variable is set, a tracer with captureResponse disabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';

      // Act
      const tracer = createTracer();

      // Assess
      expect(tracer).toEqual(expect.objectContaining({
        captureResponse: false
      }));
      delete process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE;
    });

    test('when POWERTOOLS_TRACER_CAPTURE_RESPONSE environment variable is set to invalid value, a tracer with captureResponse enabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = '';

      // Act
      const tracer = createTracer();

      // Assess
      expect(tracer).toEqual(expect.objectContaining({
        captureResponse: true
      }));
      delete process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE;
    });

    test('when POWERTOOLS_TRACER_CAPTURE_ERROR environment variable is set, a tracer with captureError disabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';

      // Act
      const tracer = createTracer();

      // Assess
      expect(tracer).toEqual(expect.objectContaining({
        captureError: false
      }));
      delete process.env.POWERTOOLS_TRACER_CAPTURE_ERROR;
    });

    test('when POWERTOOLS_TRACER_CAPTURE_ERROR environment variable is set to invalid value, a tracer with captureError enabled is returned', () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = '';

      // Act
      const tracer = createTracer();

      // Assess
      expect(tracer).toEqual(expect.objectContaining({
        captureError: true
      }));
      delete process.env.POWERTOOLS_TRACER_CAPTURE_ERROR;
    });

  });
});