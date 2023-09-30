import { ImpressionTracker } from './types';

/** An ImpressionTracker that doesn't do anything. */
export class NoopImpressionTracker implements ImpressionTracker {
  observe() {
    // Empty.
  }
  logImpressionForElement() {
    return undefined;
  }
  unobserve() {
    // Empty.
  }
  disconnect() {
    // Empty.
  }
}
