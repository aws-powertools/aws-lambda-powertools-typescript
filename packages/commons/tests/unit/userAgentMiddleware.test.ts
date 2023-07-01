import { addUserAgentMiddleware } from '../../src/userAgentMiddleware';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const options = {
  region: 'us-east-1',
  endpoint: 'http://localhost:9001',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
    sessionToken: 'test',
  },
};

describe('Given a client of instance: ', () => {
  it.each([
    {
      name: 'LambdaClient',
      client: new LambdaClient(options),
      command: new InvokeCommand({ FunctionName: 'test', Payload: '' }),
    },
    {
      name: 'DynamoDBClient',
      client: new DynamoDBClient(options),
      command: new ScanCommand({ TableName: 'test' }),
    },
    {
      name: 'SSMClient',
      client: new SSMClient(options),
      command: new GetParameterCommand({ Name: 'test' }),
    },
  ])(
    `using $name, add powertools user agent to request header at the end`,
    async ({ client, command }) => {
      addUserAgentMiddleware(client, 'my-feature');

      expect(client.middlewareStack.identify()).toContain(
        'addPowertoolsToUserAgent: POWERTOOLS,USER_AGENT'
      );

      client.middlewareStack.addRelativeTo(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (next) => (args) => {
          const userAgent = args?.request?.headers['user-agent'];
          expect(userAgent).toContain('PT/my-feature/1.11.0 PTEnv/NA');
          // make sure it's at the end of the user agent
          expect(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            userAgent
              ?.split(' ')
              .slice(userAgent?.split(' ').length - 2) // take the last to entries of the user-agent header
              .join(' ')
          ).toEqual('PT/my-feature/1.11.0 PTEnv/NA');

          return next(args);
        },
        {
          relation: 'after',
          toMiddleware: 'addPowertoolsToUserAgent',
          name: 'testUserAgentHeader',
          tags: ['TEST'],
        }
      );

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await client.send(command);
      } catch (e) {
        if (e instanceof Error && e.name === 'JestAssertionError') {
          throw e;
        }
      }
    }
  );
});
