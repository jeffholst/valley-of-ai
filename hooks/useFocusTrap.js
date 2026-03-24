'use client';

import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Traps keyboard focus within `ref` while the component is mounted.
 *
 * - Moves focus to the first focusable element inside the container on mount.
 * - Tab / Shift+Tab cycle within the container only.
 * - Returns focus to the previously focused element on unmount.
 *
 * @param {React.RefObject} ref - Ref attached to the modal panel element.
 */
export function useFocusTrap(ref) {
  useEffect(() => {
    const previouslyFocused = document.activeElement;

    // Move focus into the trap on open
    const focusable = () =>
      Array.from(ref.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []);

    const initial = focusable()[0];
    if (initial) {
      initial.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') {return;}
      const elements = focusable();
      if (elements.length === 0) {return;}

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Return focus to whatever triggered the modal open
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, []); // ref is a stable object — intentionally omitted from deps
}
