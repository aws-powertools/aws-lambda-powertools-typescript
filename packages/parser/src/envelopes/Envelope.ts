import { z, ZodSchema } from 'zod';

export abstract class Envelope {
  protected constructor() {}

  public abstract parse<T extends ZodSchema>(
    data: unknown,
    _schema: T
  ): z.infer<T>;

  protected _parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T>[] {
    if (typeof data !== 'object') {
      throw new Error('Data must be an object');
    }

    if (!schema) {
      throw new Error('Schema must be provided');
    }

    return schema.parse(data);
  }
}
