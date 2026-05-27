'use client';

import { useEffect, useRef } from 'react';

export default function BlogHoloPanel({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    let t;

    function glitch() {
      const el = ref.current;
      if (!el) {
        return;
      }
      el.dataset.glitch = 'a';
      setTimeout(() => {
        if (ref.current) {
          ref.current.dataset.glitch = 'b';
        }
      }, 50);
      setTimeout(() => {
        if (ref.current) {
          ref.current.dataset.glitch = 'a';
        }
      }, 95);
      setTimeout(() => {
        if (ref.current) {
          delete ref.current.dataset.glitch;
        }
      }, 135);

      t = setTimeout(glitch, 7000 + Math.random() * 11000);
    }

    t = setTimeout(glitch, 3000 + Math.random() * 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={ref} className="blog-holo-panel p-7 sm:p-9">
      <span className="blog-holo-corner--tr" aria-hidden="true" />
      <span className="blog-holo-corner--bl" aria-hidden="true" />
      <span className="blog-holo-corner--br" aria-hidden="true" />
      {children}
    </div>
  );
}
