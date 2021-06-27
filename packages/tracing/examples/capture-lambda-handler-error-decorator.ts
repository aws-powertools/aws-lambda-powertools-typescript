// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
process.env.AWS_XRAY_DEBUG_MODE = 'TRUE';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { TracingNamespace as dummyTracingNamespace } from './utils/namespaces/hello-world';
import { LambdaInterface } from './utils/lambda/LambdaInterface';
import { Callback, Context } from 'aws-lambda/handler';
import { Tracer } from '../src';

const tracer = new Tracer();

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    tracer.putAnnotation("StringAnnotation", "AnnotationValue");

    throw new Error('foo bar')
  }

}

dummyTracingNamespace(tracer, () => {
    new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
});