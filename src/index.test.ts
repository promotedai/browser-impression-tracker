import { ImpressionTracker } from './types';
import { newImpressionTracker } from '.';

const fakeUuid = () => {
  let i = 0;
  return () => {
    return 'uuid' + i++;
  };
};

const throwError = (err: Error) => {
  throw err;
};

// Simple mock test to boost code coverage asserts.
describe('newImpressionTracker', () => {
  let div: Element;

  beforeEach(() => {
    div = document.createElement('div');
    div.textContent = 'Test1';
  });

  const createTracker = (enabled: boolean): ImpressionTracker => {
    return newImpressionTracker(enabled, {
      handleError: throwError,
      logImpression: () => {
        /* empty */
      },
      uuid: fakeUuid(),
    });
  };

  it('enabled', () => {
    const tracker = createTracker(true);
    expect(tracker).toBeDefined();
    tracker.observe(div, 'content1', 'insertion1');
  });

  it('disabled', () => {
    const tracker = createTracker(false);
    expect(tracker).toBeDefined();
    tracker.observe(div, 'content1', 'insertion1');
  });
});
