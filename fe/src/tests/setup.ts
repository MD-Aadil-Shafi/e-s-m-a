import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Silence Ant Design / React act() warnings in test output ─────────────────
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ── Stub out matchMedia (jsdom doesn't implement it) ─────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ── Stub scrollTo (jsdom missing) ────────────────────────────────────────────
window.scrollTo = vi.fn() as any;

// ── Stub CSS.supports used by Ant Design ─────────────────────────────────────
if (!window.CSS) {
  (window as any).CSS = { supports: vi.fn(() => false) };
}

// ── Stub ResizeObserver (Ant Design Layout/Menu needs it) ────────────────────
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as any).ResizeObserver = ResizeObserverStub;
