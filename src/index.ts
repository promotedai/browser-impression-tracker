import { ImpressionTracker, TrackerArguments } from './types';
import { ImpressionTrackerImpl } from './impl';
import { NoopImpressionTracker } from './noop';

export * from './impl';
export * from './noop';

// Needs to be updated manually.
export type {
  Impression,
  ImpressionSourceTypeMap,
  ImpressionSourceTypeString,
  ImpressionTracker,
  TrackerArguments,
} from './types';

/**
 * Creates an ImpressionTracker if you have a feature flag that enables or disables this.
 * If you don't need a feature flag wrapper, call `new ImpressionTrackerImpl` instead.
 * @param enabled A quick way to disable the hook. Defaults to true.
 */
export const newImpressionTracker = (enabled: boolean, args: TrackerArguments): ImpressionTracker => {
  // If IntersectionObserver is not present, mark as not active.
  if (enabled && typeof window !== 'undefined' && typeof (window as any).IntersectionObserver !== 'undefined') {
    return new ImpressionTrackerImpl(args);
  } else {
    return new NoopImpressionTracker();
  }
};
