/**
 * Test Middy cleanupPowertools function
 *
 * @group unit/commons/cleanupPowertools
 */
import {
  cleanupPowertools,
  TRACER_KEY,
  METRICS_KEY,
} from '../../src/middleware';
import { helloworldContext as context } from '../../src/samples/resources/contexts/hello-world';

describe('Function: cleanupPowertools', () => {
  it('calls the cleanup function that are present', async () => {
    // Prepare
    const mockCleanupFunction1 = jest.fn();
    const mockCleanupFunction2 = jest.fn();
    const mockRequest = {
      event: {},
      context: context,
      response: null,
      error: null,
      internal: {
        [TRACER_KEY]: mockCleanupFunction1,
        [METRICS_KEY]: mockCleanupFunction2,
      },
    };

    // Act
    await cleanupPowertools(mockRequest);

    // Assess
    expect(mockCleanupFunction1).toHaveBeenCalledTimes(1);
    expect(mockCleanupFunction1).toHaveBeenCalledWith(mockRequest, undefined);
    expect(mockCleanupFunction2).toHaveBeenCalledTimes(1);
    expect(mockCleanupFunction2).toHaveBeenCalledWith(mockRequest, undefined);
  });
  it('resolves successfully if no cleanup function is present', async () => {
    // Prepare
    const mockRequest = {
      event: {},
      context: context,
      response: null,
      error: null,
      internal: {},
    };

    // Act & Assess
    await expect(cleanupPowertools(mockRequest)).resolves.toBeUndefined();
  });
  it('resolves successfully if cleanup function is not a function', async () => {
    // Prepare
    const mockRequest = {
      event: {},
      context: context,
      response: null,
      error: null,
      internal: {
        [TRACER_KEY]: 'not a function',
      },
    };

    // Act & Assess
    await expect(cleanupPowertools(mockRequest)).resolves.toBeUndefined();
  });
});
