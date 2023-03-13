import { Handler } from 'aws-lambda';
import { LambdaInterface, AsyncHandler, SyncHandler } from '@aws-lambda-powertools/commons';
import { ConfigServiceInterface } from '../config';
import { MetricUnit } from './MetricUnit';
import { MetricResolution } from './MetricResolution';

type Dimensions = { [key: string]: string };

type MetricsOptions = {
  customConfigService?: ConfigServiceInterface
  namespace?: string
  serviceName?: string
  singleMetric?: boolean
  defaultDimensions?: Dimensions
};

type EmfOutput = {
  [key: string]: string | number | object
  _aws: {
    Timestamp: number
    CloudWatchMetrics: {
      Namespace: string
      Dimensions: [string[]]   
      Metrics: {
        Name: string
        Unit: MetricUnit
        StorageResolution?: MetricResolution
      }[]    
    }[]
  }
};

type HandlerMethodDecorator = (
  target: LambdaInterface,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<SyncHandler<Handler>> | TypedPropertyDescriptor<AsyncHandler<Handler>>
) => void;

/**
 * Options for the metrics decorator
 *
 * Usage:
 *
 * ```typescript
 *
 * const metricsOptions: MetricsOptions = {
 *   throwOnEmptyMetrics: true,
 *   defaultDimensions: {'environment': 'dev'},
 *   captureColdStartMetric: true,
 * }
 *
 * @metrics.logMetric(metricsOptions)
 * public handler(event: any, context: any, callback: any) {
 *   // ...
 * }
 * ```
 */
type ExtraOptions = {
  throwOnEmptyMetrics?: boolean
  defaultDimensions?: Dimensions
  captureColdStartMetric?: boolean
};

type StoredMetric = {
  name: string
  unit: MetricUnit
  value: number | number[]
  resolution?: MetricResolution
};

type StoredMetrics = {
  [key: string]: StoredMetric
};

export { MetricsOptions, Dimensions, EmfOutput, HandlerMethodDecorator, ExtraOptions, StoredMetrics };
