export interface ImpressionSourceTypeMap {
  UNKNOWN_IMPRESSION_SOURCE_TYPE: 0;
  // Use this value if you expect the Impression to come from the server-side Delivery SDK.
  DELIVERY: 1;
  // If not backed by the Delivery SDK.
  CLIENT_BACKEND: 2;
}

export type ImpressionSourceTypeString = 'UNKNOWN_IMPRESSION_SOURCE_TYPE' | 'DELIVERY' | 'CLIENT_BACKEND';

/** This is a small version of the impression log record. */
export interface Impression {
   userInfo?: {
    // Anonymous user ID.
    anonUserId?: string;
    // Authenticated user ID.
    userId?: string;
    isInternalUser?: boolean;
  };
  // The ID for the Insertion (indicates a specific instance of Content in a response).
  // This is returned from Delivery SDK.  Passing this through the browser improves the join quality.  
  insertionId?: string;
  // The ID for the content, item, listing, etc.
  contentId?: string;
  // The ID for the Impression
  impressionId: string;
  // Used to the expected source of the Impression.  This impacts quality monitoring.
  sourceType?: ImpressionSourceTypeMap[keyof ImpressionSourceTypeMap] | ImpressionSourceTypeString;
  properties?: {
    // Supports arbitrary JSON for logging additional properties.
    // It's usually wrong to specify important properties here.
    // If you want a property to be considered for machine learning, add it through one of the other interfaces
    // like Delivery SDK or Content Store.
    struct: any;
  };
}

/** Arguments for ImpressionTracker. */
export interface TrackerArguments {
  /* Used to set the default source type.  Defaults to 'DELIVERY' = 1. */
  defaultSourceType?: ImpressionSourceTypeMap[keyof ImpressionSourceTypeMap] | ImpressionSourceTypeString;
  /* Called when an error occurs. */
  handleError: (err: Error) => void;
  /* To override the visibility threshold. Defaults to 50% visible. */
  intersectionOptions?: IntersectionObserverInit;
  /* Called when we should log an impression. */
  logImpression: (impression: Impression) => void;
  /* This is a required arg to reduce the number of uuid dependencies in the browser. */
  uuid: () => string;
  /* To override the visibility threshold. Defaults to 1000ms. */
  visibilityTimeThresholdMillis?: number;
}

/** Tracks whether elements are visibile long enought to be considered Impressions. */
export interface ImpressionTracker {
  /**
   * Observes an element for impression tracking.  This is a wrapper around
   * `IntersectionObserver.observe` with some extra logic.
   * 
   * @param element The HTML element.
   * @param contentId The ID for the content, item, listing, etc.
   * @param insertionId The ID for the Insertion (indicates a specific instance of Content in a
   *                    response).  This is returned from Delivery SDK.  Passing this through the
   *                    browser improves the join quality.
   */
  observe(element: Element, contentId: string, insertionId?: string): void;
  /**
   * Logs impression if not already logged.  This can be used to get the impression ID.
   * 
   * @param element The HTML element.
   * @returns the Impression ID if tracked.  Otherwise undefined.
   */
  logImpressionForElement(element: Element): string | undefined;
  /**
   * Unobserves an element.  This is a wrapper around
   * `IntersectionObserver.unobserve` with some extra logic.
   * @param element The HTML element.
   */
  unobserve(element: Element): void;
  /**
   * Disconnects the Tracker an element.  This is a wrapper around
   * `IntersectionObserver.disconnect` with some extra logic.
   */
  disconnect(): void;
}
