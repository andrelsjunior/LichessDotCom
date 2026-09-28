import { vi } from 'vitest';

// Test support for the charts: happy-dom lays nothing out (every size reads
// 0) and never calls a ResizeObserver back.

const METRICS = [
  'clientWidth',
  'clientHeight',
  'offsetWidth',
  'offsetHeight',
  'offsetLeft',
  'offsetTop',
] satisfies (keyof HTMLElement)[];

export type Metric = (typeof METRICS)[number];

export interface FakeLayout {
  /** Calls every ResizeObserver back, as a browser would after a resize. */
  readonly resize: () => void;
}

/** Sizes every element with `measure`, until the test ends. */
export function fakeLayout(measure: (element: HTMLElement, metric: Metric) => number): FakeLayout {
  const observers: FakeResizeObserver[] = [];
  class FakeResizeObserver implements ResizeObserver {
    readonly callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      observers.push(this);
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  for (const metric of METRICS) {
    vi.spyOn(HTMLElement.prototype, metric, 'get').mockImplementation(function (this: HTMLElement) {
      return measure(this, metric);
    });
  }
  return {
    resize: () => {
      for (const observer of observers) observer.callback([], observer);
    },
  };
}
