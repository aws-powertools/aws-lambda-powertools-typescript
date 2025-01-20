import { describe, expect, it } from 'vitest';
import { EventBridgeSchema } from '../../../src/schemas/eventbridge.js';
import type { EventBridgeEvent } from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../schema/utils.js';

describe('Schema: EventBridge', () => {
  const baseEvent = getTestEvent<EventBridgeEvent>({
    eventsPath: 'eventbridge',
    filename: 'base',
  });

  it('parses an EventBridge event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = EventBridgeSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not an EventBridge event', () => {
    // Prepare
    const event = omit(['detail', 'detail-type'], structuredClone(baseEvent));

    // Act & Assess
    expect(() => EventBridgeSchema.parse(event)).toThrow();
  });
});
