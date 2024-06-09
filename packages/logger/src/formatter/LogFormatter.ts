import type { EnvironmentVariablesService } from '../config/EnvironmentVariablesService.js';
import type {
  LogAttributes,
  LogFormatterInterface,
  LogFormatterOptions,
} from '../types/Log.js';
import type { UnformattedAttributes } from '../types/Logger.js';
import { LogItem } from './LogItem.js';

/**
 * Typeguard to monkey patch Error to add a cause property.
 *
 * This is needed because the `cause` property is present in ES2022 or newer.
 * Since we want to be able to format errors in Node 16.x, we need to
 * add this property ourselves. We can remove this once we drop support
 * for Node 16.x.
 *
 * @see https://nodejs.org/api/errors.html#errors_error_cause
 */
const isErrorWithCause = (
  error: Error
): error is Error & { cause: unknown } => {
  return 'cause' in error;
};

/**
 * This class defines and implements common methods for the formatting of log attributes.
 *
 * @class
 * @abstract
 * @implements {LogFormatterInterface}
 */
abstract class LogFormatter implements LogFormatterInterface {
  /**
   * EnvironmentVariablesService instance.
   * If set, it allows to access environment variables.
   */
  protected envVarsService?: EnvironmentVariablesService;

  public constructor(options?: LogFormatterOptions) {
    this.envVarsService = options?.envVarsService;
  }

  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes
   * @param {LogAttributes} additionalLogAttributes
   * @returns {LogItem}
   */
  public abstract formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem;

  /**
   * It formats a given Error parameter.
   *
   * @param {Error} error
   * @returns {LogAttributes}
   */
  public formatError(error: Error): LogAttributes {
    return {
      name: error.name,
      location: this.getCodeLocation(error.stack),
      message: error.message,
      stack: error.stack,
      cause: isErrorWithCause(error)
        ? error.cause instanceof Error
          ? this.formatError(error.cause)
          : error.cause
        : undefined,
    };
  }

  /**
   * It formats a date into a string in simplified extended ISO format (ISO 8601).
   *
   * @param {Date} now
   * @returns {string}
   */
  public formatTimestamp(now: Date): string {
    const timezone = this.envVarsService?.getTimezone() || process.env.TZ;
    if (!timezone || timezone === 'UTC') return now.toISOString();

    return this.#generateISOTimestampWithOffset(now, timezone);
  }

  /**
   * It returns a string containing the location of an error, given a particular stack trace.
   *
   * @param stack
   * @returns {string}
   */
  public getCodeLocation(stack?: string): string {
    if (!stack) {
      return '';
    }

    const stackLines = stack.split('\n');
    const regex = /\(([^)]*?):(\d+?):(\d+?)\)\\?$/;

    let i;
    for (i = 0; i < stackLines.length; i++) {
      const match = regex.exec(stackLines[i]);

      if (Array.isArray(match)) {
        return `${match[1]}:${Number(match[2])}`;
      }
    }

    return '';
  }

  /**
   * Generates a new Intl.DateTimeFormat object configured with the specified time zone
   * and formatting options. The time is displayed in 24-hour format (hour12: false).
   *
   * @param {string} timeZone - the IANA time zone identifier (e.g., "Asia/Dhaka").
   */
  #getDateFormatter = (timeZone: string): Intl.DateTimeFormat => {
    const twoDigitFormatOption = '2-digit';

    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: twoDigitFormatOption,
      day: twoDigitFormatOption,
      hour: twoDigitFormatOption,
      minute: twoDigitFormatOption,
      second: twoDigitFormatOption,
      hour12: false,
      timeZone,
    });
  };

  /**
   * Generates an ISO 8601 timestamp string with the specified time zone and the local time zone offset.
   *
   * @param {Date} date - the date to format
   * @param {string} timeZone - the IANA time zone identifier (e.g., "Asia/Dhaka").
   */
  #generateISOTimestampWithOffset(date: Date, timeZone: string): string {
    const { year, month, day, hour, minute, second } = this.#getDateFormatter(
      timeZone
    )
      .formatToParts(date)
      .reduce(
        (acc, item) => {
          acc[item.type] = item.value;

          return acc;
        },
        {} as Record<Intl.DateTimeFormatPartTypes, string>
      );
    const datePart = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    const offset = -date.getTimezoneOffset();
    const offsetSign = offset >= 0 ? '+' : '-';
    const offsetHours = Math.abs(Math.floor(offset / 60))
      .toString()
      .padStart(2, '0');
    const offsetMinutes = Math.abs(offset % 60)
      .toString()
      .padStart(2, '0');
    const millisecondPart = date.getMilliseconds().toString().padStart(3, '0');
    const offsetPart = `${offsetSign}${offsetHours}:${offsetMinutes}`;

    return `${datePart}.${millisecondPart}${offsetPart}`;
  }
}

export { LogFormatter };
