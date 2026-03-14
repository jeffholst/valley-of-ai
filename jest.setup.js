/**
 * Jest Setup File
 *
 * Configures testing environment for all tests
 * Imports custom matchers from @testing-library/jest-dom
 */

import '@testing-library/jest-dom';

// Mock window.matchMedia for theme toggle tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
