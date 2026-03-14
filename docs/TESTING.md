# Testing Guide

This document describes the testing framework and how to write tests for the Valley of AI project.

## Overview

The project uses **Jest** with **React Testing Library** for unit and integration testing.

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom matchers for DOM assertions

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (re-run on file changes)
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Files Structure

Tests are organized in the `__tests__` directory, mirroring the source structure:

```
__tests__/
├── components/
│   └── ThemeToggle.test.js       # Component unit tests
├── lib/
│   └── siteConfig.test.js        # Utility function tests
├── data/
│   └── apps.test.js              # Data validation tests
└── env.test.js                   # Environment variable tests
```

## Writing Tests

### Component Tests

Test React components using React Testing Library:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles click events', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(button).toBeInTheDocument();
  });
});
```

### Utility Function Tests

Test utility functions and libraries:

```javascript
import { myUtilFunction } from '@/lib/utils';

describe('myUtilFunction', () => {
  it('returns expected value', () => {
    expect(myUtilFunction('input')).toBe('expected');
  });
});
```

### Mocking

Mock external modules and APIs:

```javascript
// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}));

// Create custom mocks
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'test' }),
}));
```

## Best Practices

1. **Test user behavior, not implementation**: Use `screen.getByRole()` instead of `screen.getByTestId()`
2. **Query priority** (in order):
   - `getByRole()` - most accessible
   - `getByLabelText()`
   - `getByPlaceholderText()`
   - `getByText()`
   - `getByDisplayValue()`
   - `getByTestId()` - last resort

3. **Keep tests focused**: Each test should verify one behavior
4. **Use descriptive test names**: `it('displays error message when form is invalid', ...)`
5. **Arrange-Act-Assert pattern**:
   ```javascript
   it('example test', () => {
     // Arrange: set up test data and render component
     render(<MyComponent />);
     
     // Act: perform user actions
     fireEvent.click(screen.getByRole('button'));
     
     // Assert: verify expected outcome
     expect(screen.getByText('Success')).toBeInTheDocument();
   });
   ```

## Configuration Files

### jest.config.js
- Main Jest configuration
- Sets up test environment and module paths
- Defines coverage collection patterns

### jest.setup.js
- Extends test environment with custom setup
- Imports Testing Library matchers
- Mocks browser APIs (e.g., `window.matchMedia`)

## Coverage Reports

The `npm run test:coverage` command generates a detailed report showing:

- **Statements**: % of code statements executed
- **Branches**: % of conditional branches covered
- **Functions**: % of functions called
- **Lines**: % of code lines executed

Coverage reports are saved in the `coverage/` directory.

## Debugging Tests

### Run single test file
```bash
npm test -- __tests__/components/MyComponent.test.js
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should render"
```

### Run with additional output
```bash
npm test -- --verbose
```

## Common Issues

### Missing module errors
Ensure module paths in `.js` or `.jsx` use the `@/` path alias as defined in `jest.config.js`.

### DOM API not available
Some browser APIs (like `window.matchMedia`) are mocked in `jest.setup.js`. For additional mocks, add them there.

### Component state not updating
Use `waitFor()` from React Testing Library when async operations are involved:

```javascript
import { screen, waitFor } from '@testing-library/react';

it('loads data', async () => {
  render(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
