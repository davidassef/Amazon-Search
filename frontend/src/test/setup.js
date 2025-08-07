import { vi } from 'vitest';

// Mock the global fetch function
global.fetch = vi.fn();

// Mock i18next for translation
vi.mock('i18next', () => ({
  default: {
    t: (key) => key,
    use: () => ({
      init: () => {},
    }),
  },
}));
