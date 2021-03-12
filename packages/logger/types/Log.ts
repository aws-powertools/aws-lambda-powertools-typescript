type LogLevelDebug = 'DEBUG';
type LogLevelInfo = 'INFO';
type LogLevelWarn = 'WARN';
type LogLevelError = 'ERROR';

type LogLevel = LogLevelDebug | LogLevelInfo | LogLevelWarn | LogLevelError;

type LogLevelThresholds = {
  [key in LogLevel]: number;
};

type LogAttributeValue = string | number | boolean | null | undefined | LogAttributeValue[] | { [key: string]: LogAttributeValue };
type LogAttributes = { [key: string]: LogAttributeValue };

type Environment = 'dev' | 'local' | 'staging' | 'prod' | string;

export {
  LogAttributeValue,
  Environment,
  LogLevelThresholds,
  LogAttributes,
  LogLevel
};