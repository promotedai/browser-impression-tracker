import { NoopImpressionTracker } from './noop';

// Simple mock test to boost code coverage asserts.
describe('NoopImpressionTracker', () => {
  let tracker: NoopImpressionTracker;

  beforeEach(() => {
    tracker = new NoopImpressionTracker();
  });

  it('observe', () => {
    tracker.observe();
  });

  it('logImpressionForElement', () => {
    expect(tracker.logImpressionForElement()).toBeUndefined();
  });

  it('unobserve', () => {
    tracker.unobserve();
  });

  it('disconnect', () => {
    tracker.disconnect();
  });
});
