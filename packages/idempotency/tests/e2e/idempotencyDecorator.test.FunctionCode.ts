import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { DynamoDBPersistenceLayer } from '../../src/persistence';
import { idempotent } from '../../src/idempotentDecorator';
import { Context } from 'aws-lambda';
import { Logger } from '../../../logger';

const IDEMPOTENCY_TABLE_NAME = process.env.IDEMPOTENCY_TABLE_NAME;
const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
  staticPkValue: 'test',
});

interface TestEvent {
  username: string
}

const logger = new Logger();

class Lambda implements LambdaInterface {

  @idempotent({ persistenceStore: dynamoDBPersistenceLayer })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handler(_event: TestEvent, _context: Context): Promise<string> {
    logger.info(`Got test event: ${JSON.stringify(_event)}`);
    // sleep for 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return 'Hello World';
  }

}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
