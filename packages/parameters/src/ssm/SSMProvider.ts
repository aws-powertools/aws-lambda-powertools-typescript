import { BaseProvider, DEFAULT_PROVIDERS, transformValue } from '../BaseProvider';
import { GetParameterError } from '../Exceptions';
import { DEFAULT_MAX_AGE_SECS } from '../constants';
import {
  SSMClient,
  GetParameterCommand,
  paginateGetParametersByPath,
  GetParametersCommand
} from '@aws-sdk/client-ssm';
import type {
  GetParameterCommandInput,
  GetParametersByPathCommandInput,
  GetParametersCommandInput,
  GetParametersCommandOutput,
} from '@aws-sdk/client-ssm';
import type {
  SSMProviderOptions,
  SSMGetMultipleOptionsInterface,
  SSMGetOptionsInterface,
  SSMGetParametersByNameOutputInterface,
  SSMGetParametersByNameOptionsInterface,
  SSMSplitBatchAndDecryptParametersOutputType,
  SSMGetParametersByNameFromCacheOutputType,
} from '../types/SSMProvider';
import type { PaginationConfiguration } from '@aws-sdk/types';

/**
 * ## Intro
 * The Parameters utility provides a SSMProvider that allows to retrieve parameters from AWS Systems Manager.
 *
 * ## Getting started
 *
 * This utility supports AWS SDK v3 for JavaScript only. This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * To use the provider, you must install the Parameters utility and the AWS SDK v3 for JavaScript for AppConfig:
 *
 * ```sh
 * npm install @aws-lambda-powertools/parameters @aws-sdk/client-ssm
 * ```
 *
 * ## Basic usage
 *
 * Retrieve a parameter from SSM:
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter from SSM
 *   const parameter = await parametersProvider.get('/my-parameter');
 * };
 * ```
 *
 * If you want to retrieve a parameter without customizing the provider, you can use the {@link getParameter} function instead.
 *
 * You can also retrieve parameters at once. If you want to get multiple parameters under the same path, you can use the `getMultiple` method.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *  // Retrieve multiple parameters by path from SSM
 *  const parameters = await parametersProvider.getMultiple('/my-parameters-path');
 * };
 *
 * If you don't need to customize the provider, you can also use the {@link getParameters} function instead.
 *
 * If instead you want to retrieve multiple parameters by name, you can use the `getParametersByName` method.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve multiple parameters by name from SSM
 *   const parameters = await parametersProvider.getParametersByName({
 *     '/my-parameter-1': {}, // Use default options
 *     '/my-parameter-2': { transform: 'json' }, // Parse the value as JSON
 *   });
 * };
 * ```
 *
 * If you don't need to customize the provider, you can also use the {@link getParametersByName} function instead.
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
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and cache it for 10 seconds
 *   const parameter = await parametersProvider.get('/my-parameter', { maxAge: 10 });
 *   // Retrieve multiple parameters by path and cache them for 20 seconds
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { maxAge: 20 });
 * };
 * ```
 *
 * When using the `getParametersByName` method, you can set a different `maxAge` for each parameter or set a default `maxAge` for all parameters.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve multiple parameters by name and cache them individually
 *   const parameters = await parametersProvider.getParametersByName({
 *     '/my-parameter-1': { maxAge: 10 }, // Cache for 10 seconds
 *     '/my-parameter-2': { maxAge: 20 }, // Cache for 20 seconds
 *   });
 *   // Retrieve multiple parameters by name and cache them all for 20 seconds
 *   const parameters = await parametersProvider.getParametersByName({
 *     '/my-parameter-1': {},
 *     '/my-parameter-2': {},
 *   }, { maxAge: 20 });
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and skip cache
 *   const parameter = await parametersProvider.get('/my-parameter', { forceFetch: true });
 *   // Retrieve multiple parameters and skip cache
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { forceFetch: true });
 * };
 * ```
 *
 * Likewise, you can use the `forceFetch` parameter with the `getParametersByName` method both for individual parameters and for all parameters.
 *
 * ### Decryption
 *
 * If you want to retrieve a parameter that is encrypted, you can use the `decrypt` parameter. This parameter is compatible with `get`, `getMultiple` and `getParametersByName`.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and decrypt it
 *   const parameter = await parametersProvider.get('/my-parameter', { decrypt: true });
 *   // Retrieve multiple parameters and decrypt them
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { decrypt: true });
 * };
 * ```
 *
 * ### Transformations
 *
 * For parameters stored as JSON you can use the transform argument for deserialization. This will return a JavaScript object instead of a string.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and parse it as JSON
 *   const parameter = await parametersProvider.get('/my-parameter', { transform: 'json' });
 *   // Retrieve multiple parameters and parse them as JSON
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { transform: 'json' });
 * };
 * ```
 *
 * For parameters that are instead stored as base64-encoded binary data, you can use the transform argument set to `binary` for decoding. This will return a decoded string.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a base64-encoded string and decode it
 *   const parameter = await parametersProvider.get('/my-parameter', { transform: 'binary' });
 *   // Retrieve multiple base64-encoded strings and decode them
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { transform: 'binary' });
 * };
 * ```
 *
 * Both type of transformations are compatible also with the `getParametersByName` method.
 *
 * ### Extra SDK options
 *
 * When retrieving parameters, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and pass extra options to the AWS SDK v3 for JavaScript client
 *   const parameter = await parametersProvider.get('/my-parameter', {
 *     sdkOptions: {
 *       WithDecryption: true,
 *     },
 *   });
 * };
 * ```
 *
 * The objects accept the same options as respectively the [AWS SDK v3 for JavaScript GetParameter command](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/getparametercommand.html) and the [AWS SDK v3 for JavaScript GetParametersByPath command](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/getparametersbypathcommand.html).
 *
 * ### Customize AWS SDK v3 for JavaScript client
 *
 * By default, the provider will create a new SSM client using the default configuration.
 *
 * You can customize the client by passing a custom configuration object to the provider.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider({
 *   clientConfig: { region: 'eu-west-1' },
 * });
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript SSM client constructor](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/ssmclient.html#constructor).
 *
 * Otherwise, if you want to use a custom client altogether, you can pass it to the provider.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 * import { SSMClient } from '@aws-sdk/client-ssm';
 *
 * const client = new SSMClient({ region: 'eu-west-1' });
 * const parametersProvider = new SSMProvider({
 *   awsSdkV3Client: client,
 * });
 * ```
 *
 * This object must be an instance of the [AWS SDK v3 for JavaScript SSM client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/ssmclient.html).
 *
 * For more usage examples, see [our documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/utilities/parameters/).
 */
class SSMProvider extends BaseProvider {
  public client: SSMClient;
  protected errorsKey = '_errors';
  protected maxGetParametersItems = 10;

  /**
   * It initializes the SSMProvider class.
   *
   * @param {SSMProviderOptions} config - The configuration object.
   */
  public constructor(config?: SSMProviderOptions) {
    super();

    if (config?.awsSdkV3Client) {
      if (config?.awsSdkV3Client instanceof SSMClient) {
        this.client = config.awsSdkV3Client;
      } else {
        throw Error('Not a valid SSMClient provided');
      }
    } else {
      const clientConfig = config?.clientConfig || {};
      this.client = new SSMClient(clientConfig);
    }
  }

  /**
   * Retrieve a value from AWS Systems Manager.
   *
   * @example
   * ```typescript
   * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
   *
   * const parametersProvider = new SSMProvider();
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve a parameter from SSM
   *   const parameter = await parametersProvider.get('/my-parameter');
   * };
   * ```
   *
   * You can customize the retrieval of the value by passing options to the function:
   * * `maxAge` - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * * `forceFetch` - Whether to always fetch a new value from the store regardless if already available in cache
   * * `transform` - Whether to transform the value before returning it. Supported values: `json`, `binary`
   * * `sdkOptions` - Extra options to pass to the AWS SDK v3 for JavaScript client
   * * `decrypt` - Whether to decrypt the value before returning it.
   *
   * For usage examples check {@link SSMProvider}.
   *
   * @param {string} name - The name of the value to retrieve (i.e. the partition key)
   * @param {SSMGetOptionsInterface} options - Options to configure the provider
   * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/utilities/parameters/
   */
  public async get(
    name: string,
    options?: SSMGetOptionsInterface | undefined
  ): Promise<string | Record<string, unknown> | undefined> {
    return super.get(name, options) as Promise<string | Record<string, unknown> | undefined>;
  }

  /**
   * Retrieve multiple values from AWS Systems Manager.
   *
   * @example
   * ```typescript
   * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
   *
   * const parametersProvider = new SSMProvider();
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve multiple parameters from SSM
   *   const parameters = await parametersProvider.getMultiple('/my-parameters-path');
   * };
   * ```
   *
   * You can customize the retrieval of the values by passing options to the function:
   * * `maxAge` - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * * `forceFetch` - Whether to always fetch a new value from the store regardless if already available in cache
   * * `transform` - Whether to transform the value before returning it. Supported values: `json`, `binary`
   * * `sdkOptions` - Extra options to pass to the AWS SDK v3 for JavaScript client
   * * `throwOnTransformError` - Whether to throw an error if the transform fails (default: `true`)
   * * `decrypt` - Whether to decrypt the value before returning it.
   * * `recursive` - Whether to recursively retrieve all parameters under the given path (default: `false`)
   *
   * For usage examples check {@link SSMProvider}.
   *
   * @param {string} path - The path of the parameters to retrieve
   * @param {SSMGetMultipleOptionsInterface} options - Options to configure the retrieval
   * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/utilities/parameters/
   */
  public async getMultiple(
    path: string,
    options?: SSMGetMultipleOptionsInterface | undefined
  ): Promise<undefined | Record<string, unknown>> {
    return super.getMultiple(path, options);
  }

  /**
   * Retrieve multiple parameters by name from AWS Systems Manager.
   *
   * @example
   * ```typescript
   * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
   *
   * const parametersProvider = new SSMProvider();
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve multiple parameters by name from SSM
   *   const parameters = await parametersProvider.getParametersByName({
   *     '/my-parameter-1': {}, // Use default options
   *     '/my-parameter-2': { transform: 'json' }, // Parse the value as JSON
   *   });
   * };
   * ```
   * You can customize the retrieval of the values by passing options to **both the function and the parameter**:
   * * `maxAge` - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * * `forceFetch` - Whether to always fetch a new value from the store regardless if already available in cache
   * * `transform` - Whether to transform the value before returning it. Supported values: `json`, `binary`
   * * `sdkOptions` - Extra options to pass to the AWS SDK v3 for JavaScript client
   * * `throwOnTransformError` - Whether to throw an error if the transform fails (default: `true`)
   * * `decrypt` - Whether to decrypt the value before returning it
   *
   * `throwOnError` decides whether to throw an error if a parameter is not found:
   * - A) Default fail-fast behavior: Throws a `GetParameterError` error upon any failure.
   * - B) Gracefully aggregate all parameters that failed under "_errors" key.
   *
   * It transparently uses GetParameter and/or GetParameters depending on decryption requirements.
   *
   * ```sh
   *                                ┌────────────────────────┐
   *                            ┌───▶  Decrypt entire batch  │─────┐
   *                            │   └────────────────────────┘     │     ┌────────────────────┐
   *                            │                                  ├─────▶ GetParameters API  │
   *    ┌──────────────────┐    │   ┌────────────────────────┐     │     └────────────────────┘
   *    │   Split batch    │─── ┼──▶│ No decryption required │─────┘
   *    └──────────────────┘    │   └────────────────────────┘
   *                            │                                        ┌────────────────────┐
   *                            │   ┌────────────────────────┐           │  GetParameter API  │
   *                            └──▶│Decrypt some but not all│───────────▶────────────────────┤
   *                                └────────────────────────┘           │ GetParameters API  │
   *                                                                     └────────────────────┘
   * ```
   *
   * @param {Record<string, SSMGetParametersByNameOptionsInterface>} parameters - Object containing parameter names and any optional overrides
   * @param {SSMGetParametersByNameOptionsInterface} options - Options to configure the retrieval
   * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/utilities/parameters/
   */
  public async getParametersByName(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    options?: SSMGetParametersByNameOptionsInterface
  ): Promise<Record<string, unknown>> {
    const configs = { ...{
      decrypt: this.resolveDecryptionConfigValue({}) || false,
      maxAge: DEFAULT_MAX_AGE_SECS,
      throwOnError: true,
    }, ...options };

    let response: Record<string, unknown> = {};

    // NOTE: We fail early to avoid unintended graceful errors being replaced with their '_errors' param values
    SSMProvider.throwIfErrorsKeyIsPresent(parameters, this.errorsKey, configs.throwOnError);

    const {
      parametersToFetchInBatch,
      parametersToDecrypt
    } = SSMProvider.splitBatchAndDecryptParameters(parameters, configs);
    // NOTE: We need to find out whether all parameters must be decrypted or not to know which API to use
    // Logic:
    // GetParameters API -> When decrypt is used for all parameters in the the batch
    // GetParameter  API -> When decrypt is used for one or more in the batch
    if (Object.keys(parametersToDecrypt).length !== Object.keys(parameters).length) {
      const {
        response: decryptResponse,
        errors: decryptErrors
      } = await this.getParametersByNameWithDecryptOption(parametersToDecrypt, configs.throwOnError);
      const {
        response: batchResponse,
        errors: batchErrors
      } = await this.getParametersBatchByName(parametersToFetchInBatch, configs.throwOnError, false);

      response = { ...decryptResponse, ...batchResponse };
      // Fail-fast disabled, let's aggregate errors under "_errors" key so they can handle gracefully
      if (!configs.throwOnError) {
        response[this.errorsKey] = [ ...decryptErrors, ...batchErrors ];
      }
    } else {
      const {
        response: batchResponse,
        errors: batchErrors
      } = await this.getParametersBatchByName(parametersToDecrypt, configs.throwOnError, true);

      response = batchResponse;
      // Fail-fast disabled, let's aggregate errors under "_errors" key so they can handle gracefully
      if (!configs.throwOnError) {
        response[this.errorsKey] = [...batchErrors];
      }
    }

    return response;
  }

  /**
   * Retrieve a parameter from AWS Systems Manager.
   *
   * @param {string} name - Name of the parameter to retrieve
   * @param {SSMGetOptionsInterface} options - Options to customize the retrieval
   */
  protected async _get(
    name: string,
    options?: SSMGetOptionsInterface
  ): Promise<string | undefined> {
    const sdkOptions: GetParameterCommandInput = {
      ...(options?.sdkOptions || {}),
      Name: name,
    };
    sdkOptions.WithDecryption = this.resolveDecryptionConfigValue(options, sdkOptions);
    const result = await this.client.send(new GetParameterCommand(sdkOptions));

    return result.Parameter?.Value;
  }

  /**
   * Retrieve multiple items from AWS Systems Manager.
   *
   * @param {string} path - The path of the parameters to retrieve
   * @param {SSMGetMultipleOptionsInterface} options - Options to configure the provider
   */
  protected async _getMultiple(
    path: string,
    options?: SSMGetMultipleOptionsInterface
  ): Promise<Record<string, string | undefined>> {
    const sdkOptions: GetParametersByPathCommandInput = {
      ...(options?.sdkOptions || {}),
      Path: path,
    };
    const paginationOptions: PaginationConfiguration = {
      client: this.client
    };
    sdkOptions.WithDecryption = this.resolveDecryptionConfigValue(options, sdkOptions);
    sdkOptions.Recursive = options?.recursive !== undefined ?
      options.recursive : sdkOptions.Recursive;
    paginationOptions.pageSize = sdkOptions.MaxResults !== undefined ?
      sdkOptions.MaxResults : undefined;

    const parameters: Record<string, string | undefined> = {};
    for await (const page of paginateGetParametersByPath(paginationOptions, sdkOptions)) {
      for (const parameter of page.Parameters || []) {
        /**
         * Standardize the parameter name
         *
         * The parameter name returned by SSM will contain the full path.
         * However, for readability, we should return only the part after the path.
         **/

        // If the parameter is present in the response, then it has a Name
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let name = parameter.Name!;
        name = name.replace(path, '');
        if (name.startsWith('/')) {
          name = name.replace('/', '');
        }
        parameters[name] = parameter.Value;
      }
    }

    return parameters;
  }

  /**
   * Retrieve multiple items by name from AWS Systems Manager.
   *
   * @param {Record<string, SSMGetParametersByNameOptionsInterface>} parameters - An object of parameter names and their options
   * @param {throwOnError} throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   * @param {boolean} decrypt - Whether to decrypt the parameters or not
   */
  protected async _getParametersByName(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    throwOnError: boolean,
    decrypt: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    const sdkOptions: GetParametersCommandInput = {
      Names: Object.keys(parameters),
    };
    if (decrypt) {
      sdkOptions.WithDecryption = true;
    }

    const result = await this.client.send(new GetParametersCommand(sdkOptions));
    const errors = SSMProvider.handleAnyInvalidGetParameterErrors(result, throwOnError);
    const response = this.transformAndCacheGetParametersResponse(
      result,
      parameters,
      throwOnError
    );

    return {
      response,
      errors,
    };
  }

  /**
   * Slice batch and fetch parameters using GetPrameters API by max permissible batch size
   *
   * @param {Record<string, SSMGetParametersByNameOptionsInterface>} parameters - An object of parameter names and their options
   * @param {throwOnError} throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   * @param {boolean} decrypt - Whether to decrypt the parameters or not
   */
  protected async getParametersBatchByName(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    throwOnError: boolean,
    decrypt: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    let response: Record<string, unknown> = {};
    let errors: string[] = [];

    // Fetch each possible batch param from cache and return if entire batch is cached
    const { cached, toFetch } = await this.getParametersByNameFromCache(parameters);
    if (Object.keys(cached).length >= Object.keys(parameters).length) {
      response = cached;

      return {
        response,
        errors,
      };
    }

    // Slice batch by max permitted GetParameters call and retrieve the ones that are not cached
    const {
      response: batchResponse,
      errors: batchErrors
    } = await this.getParametersByNameInChunks(toFetch, throwOnError, decrypt);
    response = { ...cached, ...batchResponse };
    errors = batchErrors;

    return {
      response,
      errors,
    };
  }

  /**
   * Fetch each parameter from batch that hasn't expired from cache
   *
   * @param {Record<string, SSMGetParametersByNameOptionsInterface>} parameters - An object of parameter names and their options
   */
  protected async getParametersByNameFromCache(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>
  ): Promise<SSMGetParametersByNameFromCacheOutputType> {
    const cached: Record<string, string | Record<string, unknown>> = {};
    const toFetch: Record<string, SSMGetParametersByNameOptionsInterface> = {};

    for (const [ parameterName, parameterOptions ] of Object.entries(parameters)) {
      const cacheKey = [ parameterName, parameterOptions.transform ].toString();
      if (!this.hasKeyExpiredInCache(cacheKey)) {
        // Since we know the key exists in the cache, we can safely use the non-null assertion operator
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        cached[parameterName] = this.store.get(cacheKey)!.value as Record<string, string | Record<string, unknown>>;
      } else {
        toFetch[parameterName] = parameterOptions;
      }
    }

    return {
      cached,
      toFetch,
    };
  }

  /**
   * Slice object into chunks of max permissible batch size and fetch parameters
   *
   * @param {Record<string, SSMGetParametersByNameOptionsInterface>} parameters - An object of parameter names and their options
   * @param {boolean} throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   * @param {boolean} decrypt - Whether to decrypt the parameters or not
   */
  protected async getParametersByNameInChunks(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    throwOnError: boolean,
    decrypt: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    let response: Record<string, unknown> = {};
    let errors: string[] = [];

    // Slice object into chunks of max permissible batch size
    const chunks = Object.entries(parameters).reduce((
      acc,
      [ parameterName, parameterOptions ],
      index
    ) => {
      const chunkIndex = Math.floor(index / this.maxGetParametersItems);
      if (!acc[chunkIndex]) {
        acc[chunkIndex] = {};
      }
      acc[chunkIndex][parameterName] = parameterOptions;

      return acc;
    }, [] as Record<string, SSMGetParametersByNameOptionsInterface>[]);

    // Fetch each chunk and merge results
    for (const chunk of chunks) {
      const {
        response: chunkResponse,
        errors: chunkErrors
      } = await this._getParametersByName(chunk, throwOnError, decrypt);

      response = { ...response, ...chunkResponse };
      errors = [ ...errors, ...chunkErrors ];
    }

    return {
      response,
      errors,
    };
  }

  /**
   * Fetch parameters by name while also decrypting them
   *
   * @param {Record<string, SSMGetParametersByNameOptionsInterface>} parameters - An object of parameter names and their options
   * @param {boolean} throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   */
  protected async getParametersByNameWithDecryptOption(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    throwOnError: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    const response: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const [ parameterName, parameterOptions ] of Object.entries(parameters)) {
      try {
        response[parameterName] = await this._get(parameterName, parameterOptions);
      } catch (error) {
        if (throwOnError) {
          throw error;
        }
        errors.push(parameterName);
      }
    }

    return {
      response,
      errors,
    };
  }

  /**
   * Handle any invalid parameters returned by GetParameters API
   * GetParameters is non-atomic. Failures don't always reflect in exceptions so we need to collect.
   *
   * @param {GetParametersCommandOutput} result - The result of the GetParameters API call
   * @param {boolean} throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   */
  protected static handleAnyInvalidGetParameterErrors(
    result: GetParametersCommandOutput,
    throwOnError: boolean
  ): string[] {
    const errors: string[] = [];
    if (result.InvalidParameters && result.InvalidParameters.length > 0) {
      if (throwOnError) {
        throw new GetParameterError(
          `Failed to fetch parameters: ${result.InvalidParameters.join(', ')}`
        );
      }
      errors.push(...result.InvalidParameters);
    }

    return errors;
  }

  protected resolveDecryptionConfigValue(
    options: SSMGetOptionsInterface | SSMGetMultipleOptionsInterface = {},
    sdkOptions?: GetParameterCommandInput | GetParametersByPathCommandInput
  ): boolean | undefined {
    if (options?.decrypt !== undefined) return options.decrypt;
    if (sdkOptions?.WithDecryption !== undefined) return sdkOptions.WithDecryption;
    if (this.envVarsService.getSSMDecrypt() !== '') {
      return this.envVarsService.isValueTrue(this.envVarsService.getSSMDecrypt());
    }

    return undefined;
  }

  /**
   * Split parameters that can be fetched by GetParameters vs GetParameter.
   *
   * @param {Record<string, SSMGetParametersByNameOptionsInterface>} parameters - An object of parameter names and their options
   * @param {SSMGetParametersByNameOptionsInterface} configs - The configs passed down
   */
  protected static splitBatchAndDecryptParameters(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    configs: SSMGetParametersByNameOptionsInterface
  ): SSMSplitBatchAndDecryptParametersOutputType {
    const parametersToFetchInBatch: Record<string, SSMGetParametersByNameOptionsInterface> = {};
    const parametersToDecrypt: Record<string, SSMGetParametersByNameOptionsInterface> = {};

    for (const [ parameterName, parameterOptions ] of Object.entries(parameters)) {
      const overrides = parameterOptions;
      overrides.transform = overrides.transform || configs.transform;

      overrides.decrypt = overrides.decrypt !== undefined ?
        overrides.decrypt : configs.decrypt;
      overrides.maxAge = overrides.maxAge !== undefined ?
        overrides.maxAge : configs.maxAge;

      if (overrides.decrypt) {
        parametersToDecrypt[parameterName] = overrides;
      } else {
        parametersToFetchInBatch[parameterName] = overrides;
      }
    }

    return {
      parametersToFetchInBatch,
      parametersToDecrypt,
    };
  }

  /**
   * Throw a GetParameterError if fail-fast is disabled and `_errors` key is in parameters list.
   *
   * @param {Record<string, unknown>} parameters
   * @param {string} reservedParameter
   * @param {boolean} throwOnError
   */
  protected static throwIfErrorsKeyIsPresent(
    parameters: Record<string, unknown>,
    reservedParameter: string,
    throwOnError: boolean
  ): void {
    if (!throwOnError && parameters.hasOwnProperty(reservedParameter)) {
      throw new GetParameterError(
        `You cannot fetch a parameter named ${reservedParameter} in graceful error mode.`
      );
    }
  }

  /**
   * Transform and cache the response from GetParameters API call
   *
   * @param {GetParametersCommandOutput} response - The response from the GetParameters API call
   * @param {Record<string, SSMGetParametersByNameOptionsInterface>} parameters - An object of parameter names and their options
   * @param {boolean} throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   */
  protected transformAndCacheGetParametersResponse(
    response: GetParametersCommandOutput,
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    throwOnError: boolean
  ): Record<string, unknown> {
    const processedParameters: Record<string, unknown> = {};

    for (const parameter of response.Parameters || []) {
      // If the parameter is present in the response, then it has a Name
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parameterName = parameter.Name!;
      const parameterValue = parameter.Value;
      const parameterOptions = parameters[parameterName];

      let value;
      // NOTE: if transform is set, we do it before caching to reduce number of operations
      if (parameterValue && parameterOptions.transform) {
        value = transformValue(
          parameterValue,
          parameterOptions.transform,
          throwOnError,
          parameterName
        );
      } else if (parameterValue) {
        value = parameterValue;
      }

      if (value) {
        const cacheKey = [ parameterName, parameterOptions.transform ].toString();
        this.addToCache(
          cacheKey,
          value,
          parameterOptions.maxAge || DEFAULT_MAX_AGE_SECS
        );
      }

      processedParameters[parameterName] = value;
    }

    return processedParameters;
  }
}

export {
  SSMProvider,
  DEFAULT_PROVIDERS,
};