import {
  Impression,
  ImpressionSourceTypeMap,
  ImpressionSourceTypeString,
  ImpressionTracker,
  TrackerArguments,
} from './types';
// Polyfills and gets the test to work.
import 'intersection-observer';

// Default = At least half of item must be continuously visible for over 1 second.
const DEFAULT_VISIBILITY_RATIO_THRESHOLD = 0.5;
const DEFAULT_VISIBILITY_TIME_THRESHOLD_MILLIS = 1000;

// Internal state for an element.
interface TrackerElementState {
  alreadyLogged?: boolean;
  // Filled in during observe.
  contentId: string;
  // Filled in when the first impression is generated for the element.
  impressionId?: string;
  // Filled in during observe.
  insertionId?: string;
  // Changed when timers are created or deleted.
  // Keeping as `any` since browser and Node.js use different types.
  timeoutId?: any;
}

/**
 * ImpressionTracker implementation.  Uses IntersectionObserver, Timers and
 * `logImpressionForElement` to determine when to call the callback `logImpression`.
 * 
 * This implementation supports observing multiple elements with a single tracker.
 */
export class ImpressionTrackerImpl implements ImpressionTracker {
  private defaultSourceType?: ImpressionSourceTypeMap[keyof ImpressionSourceTypeMap] | ImpressionSourceTypeString;
  private handleError: (err: Error) => void;
  // Underscored to not collide with the method.
  private logImpression: (impression: Impression) => void;
  private stateByElement: Map<Element, TrackerElementState>;
  observer: IntersectionObserver;
  private uuid: () => string;

  constructor(args: TrackerArguments) {
    this.defaultSourceType = args.defaultSourceType ?? 1;
    this.handleError = args.handleError;
    this.logImpression = args.logImpression;
    this.stateByElement = new Map();
    this.uuid = args.uuid;
    const { visibilityTimeThresholdMillis = DEFAULT_VISIBILITY_TIME_THRESHOLD_MILLIS } = args;

    const intersectionOptions = args.intersectionOptions ?? {
      threshold: DEFAULT_VISIBILITY_RATIO_THRESHOLD,
    };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const { target } = entry;
        const state = this.stateByElement.get(target);

        if (state === undefined) {
          return;
        }

        if (entry.isIntersecting) {
          if (state.alreadyLogged) {
            return;
          }
          if (state.timeoutId === undefined) {
            state.timeoutId = setTimeout(() => this.logImpressionForElement(target), visibilityTimeThresholdMillis);
          }
        } else {
          if (state.timeoutId !== undefined) {
            clearTimeout(state.timeoutId);
            state.timeoutId = undefined;
          }
        }
      });
    }, intersectionOptions);
  }

  observe = (element: Element, contentId: string, insertionId?: string) => {
    if (!contentId) {
      this.handleError(new Error('contentId should be set'));
      return;
    }

    if (!this.stateByElement.has(element)) {
      const state = {
        contentId,
        insertionId,
      };
      this.stateByElement.set(element, state);
      this.observer.observe(element);
    }
  };

  logImpressionForElement = (element: Element) => {
    const state = this.stateByElement.get(element);
    if (state === undefined) {
      return undefined;
    }

    if (state.alreadyLogged) {
      return state.impressionId;
    }

    // Set first in case there is a bug.
    state.alreadyLogged = true;
    if (state.timeoutId !== undefined) {
      clearTimeout(state.timeoutId);
      state.timeoutId = undefined;
    }

    state.impressionId = this.uuid();
    const impression: Impression = {
      contentId: state.contentId,
      impressionId: state.impressionId,
      sourceType: this.defaultSourceType,
    };
    if (state.insertionId) {
      impression.insertionId = state.insertionId;
    }
    this.logImpression(impression);
    return state.impressionId;
  };

  unobserve = (element: Element) => {
    const state = this.stateByElement.get(element);
    if (state) {
      this.stateByElement.delete(element);
      this.observer.unobserve(element);
    }
  };

  disconnect = () => {
    this.stateByElement.clear();
    this.observer.disconnect();
  };
}
