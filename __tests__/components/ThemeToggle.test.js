/**
 * ThemeToggle Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '@/components/ThemeToggle';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img alt={props.alt ?? ''} {...props} />,
}));

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Clear DOM and storage before each test
    document.documentElement.className = '';
    localStorage.clear();
  });

  it('renders the toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('button has theme styling classes', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-2');
    expect(button).toHaveClass('rounded-lg');
  });

  it('adds dark class to documentElement when toggled to dark', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    // Initial state: no dark class (matchMedia mock returns false)
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click to enable dark mode
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class from documentElement when toggled back to light', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    // Toggle dark on, then off
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('button is clickable', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
  });
});
