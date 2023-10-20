# browser-impression-tracker
Promoted.ai, browser-side, non-React, Typescript Impression Tracker

If you use React, use the [impression-tracker-react-hook](https://github.com/promotedai/impression-tracker-react-hook).

## Summary

The ImpressionTracker identifies impression events in the browser for logging to Promoted.  Impressions are when an item is in the viewport long enough to be considered viewed by a user.  The default settings use IAB standards of `>=50%` visible for `>=1` second.  These settings can be changed.  The impression logs are used for optimization and reporting use cases.

The ImpressionTracker wraps an HTML5 IntersectionObserver and adds:
- a timer to fire earlier.
- adapts the intersection events to Promoted objects.
- limits to logging one impression even if there are extra intersection events.

## HTML Example

This example also uses the [promoted-snowplow-logger](https://github.com/promotedai/promoted-snowplow-logger) for logging the records to Promoted.

```html
<script>
  export const handleError = process.env.NODE_ENV !== 'production' ? (err) => { throw err; } : console.error;

  const eventLogger = /* from `promoted-snowplow-logger`. */

  const impressionTracker = new ImpressionTrackerImpl({
    // If this the responses come from the server-side Delivery SDK, then use 'DELIVERY', else 'CLIENT_BACKEND'
    defaultSourceType: 'DELIVERY',
    handleError,
    logImpression: eventLogger.logImpression,
    // Clients need to pass a UUID implementation in for the Tracker to use.
    // This allows clients to reduce the number of UUID generators in their browser code.
    uuid: uuidv4(),
  });

  // HTML5.  Works in most modern browsers.
  const observer = new MutationObserver((mutationsList) => {
    for(let mutation of mutationsList) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          // shouldTrack = your method to filter elements to ones that should have impression tracking.
          if (node instanceof HTMLElement && node.classList.contains("impression")) {
            impressionTracker.observe(node, node.dataset.contentId, node.dataset.insertionId);
          }
        });
        mutation.removedNodes.forEach(node => {
          if (node instanceof HTMLElement && node.classList.contains("impression")) {
            impressionTracker.unobserve(node);
          }
        });
      }
    }
  });

  const navigate = (node: Element) => {
    const {
      contentId,
      insertionId
    } = node.dataset;
    // Will log an impression if one is not already logged.
    // It returns the impressionId for passing back on action log records.
    const impressionId = impressionTracker.logImpressionForElement(node);
    const targetUrl = 'https://www.example.com/listing=' + contentId;
    eventLogger.logClick({
      impressionId,
      insertionId,
      contentId,
      targetUrl,
    });
    window.location.href = targetUrl;
  }
</script>

<div>
  <div class="impression" data-content-id="content123" data-insertion-id="insertion123" onclick="navigate(this)">
    Listing 123.
  </div>
</div>

```

The IntersectionObserver seems to work better with `<div>`s.  This library uses polyfill for pre-HTML5 browsers.

To stop tracking an element, call
```typescript
impressionTracker.unobserve(element);
```

To stop tracking all elements and clean up, call
```typescript
impressionTracker.disconnect();
```

TODO - Outline how to use `onunload` or the `MutationObserver` for unobserving elements.

## Alternatives

### Onload

Here's an alternative to using `Element.onload`:

```typescript
document.addEventListener('DOMContentLoaded', () => {
  const elementsToTrack = document.querySelectorAll('.track');
  elementsToTrack.forEach(element => {
    // TODO - implement getContentId and getInsertionId.
    impressionTracker.observe(getContentId(element), getInsertionId(element), element);
  });
});
```

### Looking up by `contentId` or `insertionId` instead.

Sometimes it's hard to get track the exact element and it's easier to use the contentId or insertionId.
`IdLookupImpressionTracker` provides a wrapper around `ImpressionTrackerImpl` that provides an optional lookup.

*Warning*: This solution only tracks the latest version of the ID.  If there are duplicate content IDs in a list, we recommend use the insertion ID solution instead.

```html
<script>
  ...
  const impressionTracker = new ImpressionTrackerImpl({ ... });
  // The interface is a little different.
  const contentIdImpressionTracker = new IdLookupImpressionTracker(tracker);

  const navigate = (contentId: string, insertionId: string) => {
    const impressionId = contentIdImpressionTracker.logImpressionForId(contentId);
    const targetUrl = 'https://www.example.com/listing=' + contentId;
    eventLogger.logClick({
      impressionId,
      insertionId,
      contentId,
    });

    // E.g. 
    window.location.href = targetUrl;
  } 
...
</script>

<div>
  <div onload="contentIdImpressionTracker.observe('content123', this, 'content123', 'insertion123')" onclick="navigate('content123', 'insertion123')">
    Your listing HTML.
  </div>
</div>
```

## Features

Uses
- [TypeScript](https://www.typescriptlang.org/) support
- [ESLint](https://eslint.org/) (with [React](https://reactjs.org/) and [Prettier](https://prettier.io/))
- Unit tests ([Jest](https://jestjs.io/) and [Testing Library](https://testing-library.com/))
- Minified output with [Terser](https://terser.org/)
- Bundle size validation with [size-limit](https://github.com/ai/size-limit)
- Flexible builds with [Rollup](https://www.rollupjs.org/)
- [CHANGELOG.md](https://keepachangelog.com/en/1.0.0/) template

## Scripts

- Run most commands: `npm run finish`
- Build the project: `npm run build`
  - Validate output bundle size with `npm run size`
- Lint the project: `npm run lint`
- Run unit tests: `npm test` or `npm test`


## When developing locally

**Broken** - We previously had an `npm run updateLink` command to use npm link for local development.  This fails with a `Error: Cannot find module 'react'`.

For now, just copy/paste the impression tracker code into the client code and test it out.
## Deploy

We use a GitHub action that runs semantic-release to determine how to update versions.  Just do a normal code review and this should work.  Depending on the message prefixes (e.g. `feat: `, `fix: `, `clean: `, `docs: `), it'll update the version appropriately.

When doing a breaking change, add `BREAKING CHANGE:` to the PR.  The colon is important.

# Resources

The base of this repository is a combination of the following repos:
- https://github.com/DenysVuika/react-lib
- https://github.com/Alexandrshy/como-north and https://dev.to/alexandrshy/creating-a-template-repository-in-github-1d05
