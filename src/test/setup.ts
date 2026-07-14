import "@testing-library/jest-dom/vitest";

class TestResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    setTimeout(() => this.callback([{ target, contentRect: { width: 900, height: 560, top: 0, right: 900, bottom: 560, left: 0, x: 0, y: 0, toJSON: () => ({}) }, borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [] }], this), 0);
  }
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver;

if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);
