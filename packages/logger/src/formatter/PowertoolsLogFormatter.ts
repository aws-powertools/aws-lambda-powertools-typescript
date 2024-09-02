import type { LogAttributes, PowertoolsLog } from '../types/Log.js';
import type { UnformattedAttributes } from '../types/Logger.js';
import { LogFormatter } from './LogFormatter.js';
import { LogItem } from './LogItem.js';

/**
 * This class is used to transform a set of log key-value pairs
 * in the Powertools for AWS Lambda default structure log format.
 *
 * @class
 * @extends {LogFormatter}
 */
class PowertoolsLogFormatter extends LogFormatter {
  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes
   * @param {LogAttributes} additionalLogAttributes
   * @returns {LogItem}
   */
  public formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem {
    const baseAttributes: PowertoolsLog = {
      cold_start: attributes.lambdaContext?.coldStart,
      function_arn: attributes.lambdaContext?.invokedFunctionArn,
      function_memory_size: attributes.lambdaContext?.memoryLimitInMB,
      function_name: attributes.lambdaContext?.functionName,
      function_request_id: attributes.lambdaContext?.awsRequestId,
      level: attributes.logLevel,
      message: attributes.message,
      sampling_rate: attributes.sampleRateValue,
      service: attributes.serviceName,
      timestamp: this.formatTimestamp(attributes.timestamp),
      xray_trace_id: attributes.xRayTraceId,
    };

    const orderedAttributes = {} as PowertoolsLog;

    // If logRecordOrder is set, order the attributes in the log item
    for (const key of this.logRecordOrder || []) {
      if (key in baseAttributes && !(key in orderedAttributes)) {
        orderedAttributes[key] = baseAttributes[key];
      }
    }

    for (const key in baseAttributes) {
      if (!(key in orderedAttributes)) {
        orderedAttributes[key] = baseAttributes[key];
      }
    }

    // Merge the ordered attributes with the rest of the attributes
    const powertoolsLogItem = new LogItem({
      attributes: orderedAttributes,
    });

    powertoolsLogItem.addAttributes(additionalLogAttributes);

    return powertoolsLogItem;
  }
}

export { PowertoolsLogFormatter };
