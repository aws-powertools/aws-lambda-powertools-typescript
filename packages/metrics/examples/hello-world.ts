import { populateEnvironmentVariables } from '../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world-service';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { LambdaInterface } from '../src/lambda/LambdaInterface';
import { Callback, Context } from 'aws-lambda/handler';
import { Metrics, MetricUnits } from '../src';

const metrics = new Metrics();

class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addMetric('test-metric', MetricUnits.Count, 10);

  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));