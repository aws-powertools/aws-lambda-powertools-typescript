import { BaseProvider, DEFAULT_PROVIDERS } from '../BaseProvider';
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from '@aws-sdk/client-appconfigdata';
import type { StartConfigurationSessionCommandInput } from '@aws-sdk/client-appconfigdata';
import type {
  AppConfigProviderOptions,
  AppConfigGetOptionsInterface,
} from '../types/AppConfigProvider';

/**
 * ## Intro
 * The Parameters utility provides an AppConfigProvider that allows to retrieve configuration profiles from AWS AppConfig.
 *
 * ## Getting started
 *
 * This utility supports AWS SDK v3 for JavaScript only. This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * To use the provider, you must install the Parameters utility and the AWS SDK v3 for JavaScript for AppConfig:
 *
 * ```sh
 * npm install @aws-lambda-powertools/parameters @aws-sdk/client-appconfigdata
 * ```
 *
 * ## Basic usage
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a configuration profile
 *   const encodedConfig = await configProvider.get('my-config');
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 * If you want to retrieve configs without customizing the provider, you can use the {@link getAppConfig} function instead.
 *
 * ## Advanced usage
 *
 * ### Caching
 *
 * By default, the provider will cache parameters retrieved in-memory for 5 seconds.
 * You can adjust how long values should be kept in cache by using the `maxAge` parameter.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a configuration profile and cache it for 10 seconds
 *   const encodedConfig = await configProvider.get('my-config', { maxAge: 10 });
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a config and always fetch the latest value
 *   const config = await configProvider.get('my-config', { forceFetch: true });
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 *
 * ### Transformations
 *
 * For configurations stored as freeform JSON, Freature Flag, you can use the transform argument for deserialization. This will return a JavaScript object instead of a string.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a JSON config or Feature Flag and parse it as JSON
 *   const config = await configProvider.get('my-config', { transform: 'json' });
 * };
 * ```
 *
 * For configurations that are instead stored as base64-encoded binary data, you can use the transform argument set to `binary` for decoding. This will return a decoded string.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a base64-encoded string and decode it
 *   const config = await configProvider.get('my-config', { transform: 'binary' });
 * };
 * ```
 *
 * ### Extra SDK options
 *
 * When retrieving a configuration profile, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a config and pass extra options to the AWS SDK v3 for JavaScript client
 *   const config = await configProvider.get('my-config', {
 *     sdkOptions: {
 *       RequiredMinimumPollIntervalInSeconds: 60,
 *     },
 *   });
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript AppConfigData client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-appconfigdata/interfaces/startconfigurationsessioncommandinput.html).
 *
 * ### Customize AWS SDK v3 for JavaScript client
 *
 * By default, the provider will create a new AppConfigData client using the default configuration.
 *
 * You can customize the client by passing a custom configuration object to the provider.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider({
 *   clientConfig: { region: 'eu-west-1' },
 * });
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript AppConfig Data client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-appconfigdata/interfaces/appconfigdataclientconfig.html).
 *
 * Otherwise, if you want to use a custom client altogether, you can pass it to the provider.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 * import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';
 *
 * const client = new AppConfigDataClient({ region: 'eu-west-1' });
 * const configProvider = new AppConfigProvider({
 *   awsSdkV3Client: client,
 * });
 * ```
 *
 * This object must be an instance of the [AWS SDK v3 for JavaScript AppConfig Data client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-appconfigdata/classes/appconfigdataclient.html).
 *
 * For more usage examples, see [our documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/utilities/parameters/).
 */
class AppConfigProvider extends BaseProvider {
  public client: AppConfigDataClient;
  protected configurationTokenStore = new Map<string, string>();
  protected valueStore = new Map<string, Uint8Array>();
  private application?: string;
  private environment: string;

  /**
   * It initializes the AppConfigProvider class.
   * *
   * @param {AppConfigProviderOptions} options - The configuration object.
   */
  public constructor(options: AppConfigProviderOptions) {
    super();
    if (options?.awsSdkV3Client) {
      if (options?.awsSdkV3Client instanceof AppConfigDataClient) {
        this.client = options.awsSdkV3Client;
      } else {
        throw Error('Not a valid AppConfigDataClient provided');
      }
    } else {
      this.client = new AppConfigDataClient(options.clientConfig || {});
    }

    this.application =
      options?.application || this.envVarsService.getServiceName();
    if (!this.application || this.application.trim().length === 0) {
      throw new Error(
        'Application name is not defined or POWERTOOLS_SERVICE_NAME is not set'
      );
    }
    this.environment = options.environment;
  }

  /**
   * Retrieve a configuration profile from AWS AppConfig.
   *
   * @example
   * ```typescript
   * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
   *
   * const configProvider = new AppConfigProvider();
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve a configuration profile
   *   const encodedConfig = await configProvider.get('my-config');
   *   const config = new TextDecoder('utf-8').decode(encodedConfig);
   * };
   * ```
   *
   * You can customize the retrieval of the configuration profile by passing options to the function:
   * * `maxAge` - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * * `forceFetch` - Whether to always fetch a new value from the store regardless if already available in cache
   * * `transform` - Whether to transform the value before returning it. Supported values: `json`, `binary`
   * * `sdkOptions` - Extra options to pass to the AWS SDK v3 for JavaScript client
   *
   * For usage examples check {@link AppConfigProvider}.
   *
   * @param {string} name - The name of the configuration profile or its ID
   * @param {GetAppConfigCombinedInterface} options - Options to configure the provider
   * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/utilities/parameters/
   */
  public async get(
    name: string,
    options?: AppConfigGetOptionsInterface
  ): Promise<undefined | string | Uint8Array | Record<string, unknown>> {
    return super.get(name, options);
  }

  /**
   * Retrieving multiple configurations is not supported by AWS AppConfig.
   */
  public async getMultiple(
    path: string,
    _options?: unknown
  ): Promise<undefined | Record<string, unknown>> {
    return super.getMultiple(path);
  }

  /**
   * Retrieve a configuration from AWS AppConfig.
   *
   * @param {string} name - Name of the configuration or its ID
   * @param {AppConfigGetOptionsInterface} options - SDK options to propagate to `StartConfigurationSession` API call
   */
  protected async _get(
    name: string,
    options?: AppConfigGetOptionsInterface
  ): Promise<Uint8Array | undefined> {
    /**
     * The new AppConfig APIs require two API calls to return the configuration
     * First we start the session and after that we retrieve the configuration
     * We need to store { name: token } pairs to use in the next execution
     * We also need to store { name : value } pairs because AppConfig returns
     * an empty value if the session already has the latest configuration
     * but, we don't want to return an empty value to our callers.
     * {@link https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-retrieving-the-configuration.html}
     **/
    if (!this.configurationTokenStore.has(name)) {
      const sessionOptions: StartConfigurationSessionCommandInput = {
        ...(options?.sdkOptions || {}),
        ApplicationIdentifier: this.application,
        ConfigurationProfileIdentifier: name,
        EnvironmentIdentifier: this.environment,
      };

      const sessionCommand = new StartConfigurationSessionCommand(
        sessionOptions
      );

      const session = await this.client.send(sessionCommand);

      if (!session.InitialConfigurationToken)
        throw new Error('Unable to retrieve the configuration token');

      this.configurationTokenStore.set(name, session.InitialConfigurationToken);
    }

    const getConfigurationCommand = new GetLatestConfigurationCommand({
      ConfigurationToken: this.configurationTokenStore.get(name),
    });

    const response = await this.client.send(getConfigurationCommand);

    if (response.NextPollConfigurationToken) {
      this.configurationTokenStore.set(
        name,
        response.NextPollConfigurationToken
      );
    } else {
      this.configurationTokenStore.delete(name);
    }

    /** When the response is not empty, stash the result locally before returning
     * See AppConfig docs:
     * {@link https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-retrieving-the-configuration.html}
     **/
    if (
      response.Configuration !== undefined &&
      response.Configuration?.length > 0
    ) {
      this.valueStore.set(name, response.Configuration);

      return response.Configuration;
    }

    // Otherwise, use a stashed value
    return this.valueStore.get(name);
  }

  /**
   * Retrieving multiple configurations is not supported by AWS AppConfig.
   *
   * @throws Not Implemented Error.
   */
  protected async _getMultiple(
    _path: string,
    _sdkOptions?: unknown
  ): Promise<Record<string, string | undefined>> {
    throw new Error('Method not implemented.');
  }
}

export { AppConfigProvider, DEFAULT_PROVIDERS };
