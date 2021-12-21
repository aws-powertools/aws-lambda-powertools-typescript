import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { populateEnvironmentVariables } from '../tests/helpers';
import { Metrics, MetricUnits } from '../src';
import middy from '@middy/core';
import { logMetrics } from '../src/middleware/middy';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

const metrics = new Metrics();

const lambdaHandler = async (): Promise<void> => {
  const singleMetric = metrics.singleMetric();
  metrics.addDimension('OuterDimension', 'true');
  singleMetric.addDimension('InnerDimension', 'true');
  metrics.addMetric('test-metric', MetricUnits.Count, 10);
  singleMetric.addMetric('single-metric', MetricUnits.Percent, 50);
};

const handlerWithMiddleware = middy(lambdaHandler)
  .use(logMetrics(metrics));

handlerWithMiddleware(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));