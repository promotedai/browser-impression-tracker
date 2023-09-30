import { ImpressionTrackerImpl } from './impl';

jest.useFakeTimers();

const fakeUuid = () => {
  let i = 0;
  return () => {
    return 'uuid' + i++;
  };
};

const runAllTimers = () => jest.runAllTimers();

const throwError = (err: Error) => {
  throw err;
};

const noopError = () => {
  /* empty */
};

describe('ImpressionTrackerImpl', () => {
  const originalIntersectionObserver = global.IntersectionObserver;
  let tracker: ImpressionTrackerImpl;
  let logImpression: any;

  const createTracker = (handleError: (err: Error) => void): ImpressionTrackerImpl => {
    return new ImpressionTrackerImpl({
      handleError,
      logImpression,
      uuid: fakeUuid(),
    });
  };

  const trigger = (event: any) => {
    (tracker.observer as any).trigger(event);
  };

  beforeAll(() => {
    // Mock out the constructor.
    global.IntersectionObserver = class IntersectionObserver {
      private callback: any;

      constructor(callback: any) {
        this.callback = callback;
      }

      observe() {
        // Empty.
      }

      unobserve() {
        // Empty.
      }

      disconnect() {
        // Empty.
      }

      trigger(entries: any) {
        // Use this method to trigger the callback
        if (this.callback) {
          this.callback(entries);
        }
      }
    } as any;
  });

  afterAll(() => {
    global.IntersectionObserver = originalIntersectionObserver;
  });

  beforeEach(() => {
    logImpression = jest.fn();
    tracker = createTracker(throwError);
  });

  describe('empty', () => {
    it('disconnect', () => {
      tracker.disconnect();
      expect(logImpression.mock.calls).toEqual([]);
    });
  });

  describe('observe single div', () => {
    let div: Element;

    beforeEach(() => {
      div = document.createElement('div');
      div.textContent = 'Test1';
    });

    describe('no intersection events', () => {
      describe('unobserve', () => {
        it('observed div', () => {
          tracker.observe(div, 'content1', 'insertion1');
          tracker.unobserve(div);
          expect(logImpression.mock.calls).toEqual([]);
        });

        it('unobserve div', () => {
          tracker.observe(div, 'content1', 'insertion1');
          const otherDiv = document.createElement('div');
          div.textContent = 'Other div';
          tracker.unobserve(otherDiv);
          expect(logImpression.mock.calls).toEqual([]);
        });
      });

      it('disconnect', () => {
        tracker.observe(div, 'content1', 'insertion1');
        tracker.disconnect();
        expect(logImpression.mock.calls).toEqual([]);
      });

      it('observe multiple times', () => {
        tracker.observe(div, 'content1', 'insertion1');
        tracker.observe(div, 'content1', 'insertion1');
        tracker.observe(div, 'content1', 'insertion1');
        tracker.unobserve(div);
        expect(logImpression.mock.calls).toEqual([]);
      });

      describe('different args', () => {
        it('additional options', () => {
          tracker = new ImpressionTrackerImpl({
            defaultSourceType: 'DELIVERY',
            handleError: throwError,
            logImpression,
            uuid: fakeUuid(),
            visibilityTimeThresholdMillis: 500,
            intersectionOptions: {
              threshold: 0.7,
            },
          });

          tracker.observe(div, 'content1', 'insertion1');
          const impressionId = tracker.logImpressionForElement(div);
          expect(impressionId).toEqual('uuid0');
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 'DELIVERY',
              },
            ],
          ]);
          tracker.unobserve(div);
        });
      });

      describe('logImpressionForElement', () => {
        it('has insertionId', () => {
          tracker.observe(div, 'content1', 'insertion1');
          const impressionId = tracker.logImpressionForElement(div);
          expect(impressionId).toEqual('uuid0');
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 1,
              },
            ],
          ]);
          tracker.unobserve(div);
        });

        it('no insertionId', () => {
          tracker.observe(div, 'content1', undefined);
          const impressionId = tracker.logImpressionForElement(div);
          expect(impressionId).toEqual('uuid0');
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                sourceType: 1,
              },
            ],
          ]);
          tracker.unobserve(div);
        });

        it('empty string insertionId', () => {
          tracker.observe(div, 'content1', '');
          const impressionId = tracker.logImpressionForElement(div);
          expect(impressionId).toEqual('uuid0');
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                sourceType: 1,
              },
            ],
          ]);
          tracker.unobserve(div);
        });

        it('multiple times', () => {
          tracker.observe(div, 'content1', 'insertion1');
          const impressionId1 = tracker.logImpressionForElement(div);
          const impressionId2 = tracker.logImpressionForElement(div);
          const impressionId3 = tracker.logImpressionForElement(div);
          expect(impressionId1).toEqual('uuid0');
          expect(impressionId2).toEqual('uuid0');
          expect(impressionId3).toEqual('uuid0');
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 1,
              },
            ],
          ]);
          tracker.unobserve(div);
        });

        it('for not observed div', () => {
          tracker.observe(div, 'content1', 'insertion1');
          const otherDiv = document.createElement('div');
          div.textContent = 'Other div';
          const impressionId = tracker.logImpressionForElement(otherDiv);
          expect(impressionId).toBeUndefined();
          expect(logImpression.mock.calls).toEqual([]);
          tracker.unobserve(div);
        });

        describe('validate', () => {
          it('no contentId', () => {
            expect(() => tracker.observe(div, '', 'insertion1')).toThrow();
            const impressionId = tracker.logImpressionForElement(div);
            expect(impressionId).toBeUndefined();
            tracker.unobserve(div);
            expect(logImpression.mock.calls).toEqual([]);
          });
        });

        describe('log error', () => {
          it('no contentId', () => {
            tracker = createTracker(noopError);

            // Does not throw.  Silently fails.
            tracker.observe(div, '', 'insertion1');
            const impressionId = tracker.logImpressionForElement(div);
            expect(impressionId).toBeUndefined();
            tracker.unobserve(div);
            expect(logImpression.mock.calls).toEqual([]);
          });
        });
      });
    });

    describe('intersection events', () => {
      it('unobserve', () => {
        tracker.observe(div, 'content1', 'insertion1');
        trigger([{ isIntersecting: true, target: div }]);
        tracker.unobserve(div);
        expect(logImpression.mock.calls).toEqual([]);
      });

      it('disconnect', () => {
        tracker.observe(div, 'content1', 'insertion1');
        trigger([{ isIntersecting: true, target: div }]);
        tracker.disconnect();
        expect(logImpression.mock.calls).toEqual([]);
      });

      it('observe multiple times', () => {
        tracker.observe(div, 'content1', 'insertion1');
        tracker.observe(div, 'content1', 'insertion1');
        tracker.observe(div, 'content1', 'insertion1');
        trigger([{ isIntersecting: true, target: div }]);
        tracker.unobserve(div);
        expect(logImpression.mock.calls).toEqual([]);
      });

      it('event for different element', () => {
        tracker.observe(div, 'content1', 'insertion1');
        const otherDiv = document.createElement('div');
        div.textContent = 'Other div';

        trigger([{ isIntersecting: true, target: otherDiv }]);
        tracker.unobserve(div);
        expect(logImpression.mock.calls).toEqual([]);
      });

      describe('timer logs impression', () => {
        it('no follow up logImpressionForElement calls', () => {
          tracker.observe(div, 'content1', 'insertion1');
          trigger([{ isIntersecting: true, target: div }]);

          runAllTimers();
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 1,
              },
            ],
          ]);
          tracker.unobserve(div);
        });

        it('has follow up logImpressionForElement call', () => {
          tracker.observe(div, 'content1', 'insertion1');
          trigger([{ isIntersecting: true, target: div }]);

          runAllTimers();
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 1,
              },
            ],
          ]);
          const impressionId = tracker.logImpressionForElement(div);
          expect(impressionId).toEqual('uuid0');
          expect(logImpression.mock.calls.length).toEqual(1);
          tracker.unobserve(div);
        });

        it('logImpressionForElement before timer', () => {
          tracker.observe(div, 'content1', 'insertion1');
          trigger([{ isIntersecting: true, target: div }]);

          const impressionId = tracker.logImpressionForElement(div);
          expect(impressionId).toEqual('uuid0');
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 1,
              },
            ],
          ]);
          // This shouldn't do anything because the the timer should be cleared out.
          runAllTimers();
          expect(logImpression.mock.calls.length).toEqual(1);
          tracker.unobserve(div);
        });

        it('visible then not visible then logImpressionForElement', () => {
          tracker.observe(div, 'content1', 'insertion1');
          trigger([{ isIntersecting: true, target: div }]);
          trigger([{ isIntersecting: false, target: div }]);

          runAllTimers();
          expect(logImpression.mock.calls).toEqual([]);
          const impressionId = tracker.logImpressionForElement(div);
          expect(impressionId).toEqual('uuid0');
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 1,
              },
            ],
          ]);
          tracker.unobserve(div);
        });

        it('visible then timer then not visible', () => {
          tracker.observe(div, 'content1', 'insertion1');
          trigger([{ isIntersecting: true, target: div }]);

          runAllTimers();
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 1,
              },
            ],
          ]);

          trigger([{ isIntersecting: false, target: div }]);
          expect(logImpression.mock.calls.length).toEqual(1);
          tracker.unobserve(div);
        });

        it('visible then not visible then visible then logImpressionForElement', () => {
          tracker.observe(div, 'content1', 'insertion1');
          trigger([{ isIntersecting: true, target: div }]);
          trigger([{ isIntersecting: false, target: div }]);
          trigger([{ isIntersecting: true, target: div }]);

          runAllTimers();
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 1,
              },
            ],
          ]);
          const impressionId = tracker.logImpressionForElement(div);
          expect(impressionId).toEqual('uuid0');
          expect(logImpression.mock.calls.length).toEqual(1);
          tracker.unobserve(div);
        });

        it('visible events after timer', () => {
          tracker.observe(div, 'content1', 'insertion1');
          trigger([{ isIntersecting: true, target: div }]);
          runAllTimers();
          expect(logImpression.mock.calls).toEqual([
            [
              {
                contentId: 'content1',
                impressionId: 'uuid0',
                insertionId: 'insertion1',
                sourceType: 1,
              },
            ],
          ]);

          trigger([{ isIntersecting: false, target: div }]);
          trigger([{ isIntersecting: true, target: div }]);
          trigger([{ isIntersecting: false, target: div }]);
          trigger([{ isIntersecting: true, target: div }]);
          const impressionId = tracker.logImpressionForElement(div);
          expect(impressionId).toEqual('uuid0');
          expect(logImpression.mock.calls.length).toEqual(1);
          tracker.unobserve(div);
        });
      });
    });
  });
});
