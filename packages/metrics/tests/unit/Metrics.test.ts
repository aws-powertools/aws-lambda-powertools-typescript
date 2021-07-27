import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
import { LambdaInterface } from '../../examples/utils/lambda/LambdaInterface';
import { populateEnvironmentVariables } from '../helpers';
import { Metrics, MetricUnits } from '../../src/';

const MAX_METRICS_SIZE = 100;
const MAX_DIMENSION_COUNT = 9;

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

interface LooseObject {
  [key: string]: string
}

describe('Class: Metrics', () => {

  const originalEnvironmentVariables = process.env;

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  beforeAll(() => {
    populateEnvironmentVariables();
  });

  afterEach(() => {
    process.env = originalEnvironmentVariables;
    delete process.env.POWERTOOLS_SERVICE_NAME;
  });

  describe('Feature: Dimensions logging', () => {
    test('should log service dimension correctly when passed', () => {
      const serviceName = 'testing_name';

      const metrics = new Metrics({ namespace: 'test', service: serviceName });
      metrics.addMetric('test_name', MetricUnits.Seconds, 14);
      const loggedData = metrics.serializeMetrics();

      expect(loggedData.service).toEqual(serviceName);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0][0]).toEqual('service');
    });

    test('should log service dimension correctly from env var when not passed', () => {
      const serviceName = 'hello-world-service';
      process.env.POWERTOOLS_SERVICE_NAME = serviceName;

      const metrics = new Metrics({ namespace: 'test' });
      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      const loggedData = metrics.serializeMetrics();

      expect(loggedData.service).toEqual(serviceName);
    });

    test('Additional dimensions should be added correctly', () => {
      const additionalDimension = { name: 'metric2', value: 'metric2Value' };
      const metrics = new Metrics({ namespace: 'test' });

      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      metrics.addDimension(additionalDimension.name, additionalDimension.value);
      const loggedData = metrics.serializeMetrics();

      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
      expect(loggedData[additionalDimension.name]).toEqual(additionalDimension.value);
    });

    test('Adding more than max dimensions should throw error', () => {
      expect.assertions(1);
      const metrics = new Metrics();
      for (let x =0; x < MAX_DIMENSION_COUNT ; x++) {
        metrics.addDimension(`Dimension-${x}`, `value-${x}`);
      }
      try {
        metrics.addDimension(`Dimension-${MAX_DIMENSION_COUNT}`, `value-${MAX_DIMENSION_COUNT}`);
      }
      catch (e) {
        expect(e.message).toBe(`Max dimension count of ${MAX_DIMENSION_COUNT} hit`);
      }
    });

    test('Additional bulk dimensions should be added correctly', () => {
      const additionalDimensions: LooseObject = { 'dimension2': 'dimension2Value', 'dimension3': 'dimension3Value' };
      const metrics = new Metrics({ namespace: 'test' });

      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      metrics.addDimensions(additionalDimensions);
      const loggedData = metrics.serializeMetrics();

      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(2);
      Object.keys(additionalDimensions).forEach((key) => {

        expect(loggedData[key]).toEqual(additionalDimensions[key]);
      });
    });

    test('Bulk Adding more than max dimensions should throw error', () => {
      expect.assertions(1);
      const metrics = new Metrics();
      const additionalDimensions: LooseObject = {};

      metrics.addDimension(`Dimension-Initial`, `Dimension-InitialValue`);
      for (let x =0; x < MAX_DIMENSION_COUNT ; x++) {
        additionalDimensions[`dimension${x}`] = `dimension${x}Value`;
      }

      try {
        metrics.addDimensions(additionalDimensions);
      }
      catch (e) {
        expect(e.message).toBe(`Adding ${Object.keys(additionalDimensions).length} dimensions would exceed max dimension count of ${MAX_DIMENSION_COUNT}`);
      }
    });
  });

  describe('Feature: Metadata', () => {
    test('Metadata should be added correctly', () => {
      const metadataItem = { name: 'metaName', value: 'metaValue' };

      const metrics = new Metrics({ namespace: 'test' });
      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      metrics.addMetadata(metadataItem.name, metadataItem.value);

      const loggedData = metrics.serializeMetrics();
      metrics.clearMetadata();
      const postClearLoggedData = metrics.serializeMetrics();

      expect(loggedData[metadataItem.name]).toEqual(metadataItem.value);
      expect(postClearLoggedData[metadataItem.name]).toBeUndefined();

    });
  });

  describe('Feature: Default Dimensions', () => {

    test('Adding more than max default dimensions should throw error', () => {
      expect.assertions(1);

      const defaultDimensions: LooseObject = {};
      for (let x = 0; x < MAX_DIMENSION_COUNT + 1; x ++) {
        defaultDimensions[`dimension-${x}`] = `value-${x}`;
      }

      const metrics = new Metrics({ namespace: 'test' });

      try {
        class LambdaFunction implements LambdaInterface {
          @metrics.logMetrics({ defaultDimensions: defaultDimensions })
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
            return;
          }
        }

        new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      } catch (e) {
        expect(e.message).toBe('Max dimension count hit');
      }
    });

    test('Clearing dimensions should only remove added dimensions, not default', () => {
      const metrics = new Metrics({ namespace: 'test' });
      const additionalDimension = { name: 'metric2', value: 'metric2Value' };

      class LambdaFunction implements LambdaInterface {

        @metrics.logMetrics({ defaultDimensions: { 'default': 'defaultValue' } })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
          metrics.addDimension(additionalDimension.name, additionalDimension.value);
          const loggedData = metrics.serializeMetrics();
          expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(2);
          expect(loggedData[additionalDimension.name]).toEqual(additionalDimension.value);
          metrics.clearDimensions();
        }
      }

      new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(console.log).toBeCalledTimes(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('default');
      expect(loggedData.default).toContain('defaultValue');
    });

    test('Clearing default dimensions should only remove default dimensions, not added', () => {
      const metrics = new Metrics({ namespace: 'test' });
      const additionalDimension = { name: 'metric2', value: 'metric2Value' };

      class LambdaFunction implements LambdaInterface {

        @metrics.logMetrics({ defaultDimensions: { 'default': 'defaultValue' } })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
          metrics.addDimension(additionalDimension.name, additionalDimension.value);
          metrics.clearDefaultDimensions();
        }
      }

      new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(console.log).toBeCalledTimes(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain(additionalDimension.name);
      expect(loggedData[additionalDimension.name]).toContain(additionalDimension.value);
    });
  });
  
  describe('Feature: Cold Start', () => {
    test('Cold start metric should only be written out once', () => {
      const metrics = new Metrics({ namespace: 'test' });

      class LambdaFunction implements LambdaInterface {

        @metrics.logMetrics({ captureColdStartMetric: true })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
        }
      }

      new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked again!'));
      const loggedData = [ JSON.parse(consoleSpy.mock.calls[0][0]), JSON.parse(consoleSpy.mock.calls[1][0]) ];

      expect(console.log).toBeCalledTimes(3);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe('ColdStart');
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe('Count');
      expect(loggedData[0].ColdStart).toBe(1);
    });

    test('Cold should have service and function name if present', () => {
      const serviceName = 'test-service';
      const metrics = new Metrics({ namespace: 'test', service: serviceName });

      class LambdaFunction implements LambdaInterface {

        @metrics.logMetrics({ captureColdStartMetric: true })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
        }
      }
      new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(console.log).toBeCalledTimes(2);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe('ColdStart');
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe('Count');
      expect(loggedData.service).toBe(serviceName);
      expect(loggedData.function_name).toBe(dummyContext.functionName);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('service');
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('function_name');
      expect(loggedData.ColdStart).toBe(1);
    });

    test('Cold should still log, without a function name', () => {
      const serviceName = 'test-service';
      const metrics = new Metrics({ namespace: 'test', service: serviceName });
      const newDummyContext = JSON.parse(JSON.stringify(dummyContext));
      delete newDummyContext.functionName;
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ captureColdStartMetric: true })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
        }
      }

      new LambdaFunction().handler(dummyEvent, newDummyContext, () => console.log('Lambda invoked!'));
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(console.log).toBeCalledTimes(2);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe('ColdStart');
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe('Count');
      expect(loggedData.service).toBe(serviceName);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('service');
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).not.toContain('function_name');
      expect(loggedData.ColdStart).toBe(1);

    });
  });

  describe('Feature: raiseOnEmptyMetrics', () => {
    test('Error should be thrown on empty metrics when raiseOnEmptyMetrics is passed', () => {
      expect.assertions(1);
      
      const metrics = new Metrics({ namespace: 'test' });
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ raiseOnEmptyMetrics: true })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          return;
        }
      }
      
      try {
        new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      }
      catch (e) {
        expect(e.message).toBe('Must contain at least one metric');
      }
    });
  });
  
  describe('Feature: Auto log at limit', () => {
    test('Logger should write out block when limit is reached', () => {
      const metrics = new Metrics({ namespace: 'test' });
      const extraCount = 10;
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          for (let x =0; x<MAX_METRICS_SIZE + extraCount; x++) {
            metrics.addMetric(`test_name_${x}`, MetricUnits.Count, x);
          }
        }
      }

      new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      const loggedData = [ JSON.parse(consoleSpy.mock.calls[0][0]), JSON.parse(consoleSpy.mock.calls[1][0]) ];

      expect(console.log).toBeCalledTimes(2);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(100);
      expect(loggedData[1]._aws.CloudWatchMetrics[0].Metrics.length).toBe(extraCount);
    });
  });

  describe('Feature: Output validation ', () => {
    test('Should throw error on serialisation if no namepace is set', () => {
      delete process.env.POWERTOOLS_METRICS_NAMESPACE;
      expect.assertions(1);
      const metrics = new Metrics();
      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      try {
        metrics.serializeMetrics();
      }
      catch (e) {
        expect(e.message).toBe('Namespace must be defined');
      }
    });
  });

  describe('Feature: Clearing Metrics ', () => {
    test('Clearing metrics should return empty', () => {
      const metrics = new Metrics({ namespace: 'test' });
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ defaultDimensions: { 'default': 'defaultValue' } })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
          const loggedData = metrics.serializeMetrics();
          metrics.clearMetrics();
          const afterClearingLoggedData = metrics.serializeMetrics();

          expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toEqual(1);
          expect(afterClearingLoggedData._aws.CloudWatchMetrics[0].Metrics.length).toEqual(0);
        }
      }

      new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
    });

    test('Purge Stored Metrics should log and clear', () => {
      const metrics = new Metrics({ namespace: 'test' });
      const extraCount = 10;
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          metrics.addMetric(`test_name_1`, MetricUnits.Count, 1);
          metrics.purgeStoredMetrics();
        }
      }

      new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      const loggedData = [ JSON.parse(consoleSpy.mock.calls[0][0]), JSON.parse(consoleSpy.mock.calls[1][0]) ];

      expect(console.log).toBeCalledTimes(2);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[1]._aws.CloudWatchMetrics[0].Metrics.length).toBe(0);
    });

  });

  describe('Feature: Custom Config Service', () => {
    test( 'Custom Config Service should be called for service', () => {
      const serviceName = 'Custom Provider Service Name';
      const namespace = 'Custom Provider namespace';
      const customConfigService = {
        getService: () => serviceName,
        getNamespace: () => namespace
      };

      const metrics = new Metrics({ customConfigService: customConfigService });
      const loggedData = metrics.serializeMetrics();

      expect(loggedData.service).toEqual(serviceName);
      expect(loggedData._aws.CloudWatchMetrics[0].Namespace).toEqual(namespace);

    });
  });

});