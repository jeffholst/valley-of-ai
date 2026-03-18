'use client';

import { useEffect, useState } from 'react';

/**
 * OptionsDrawer — Right-side sliding panel with toggle switches for
 * visual & audio effects on the Valley of AI homepage.
 *
 * Props:
 *   options  — Object with boolean flags for each effect
 *              { pterodactyl, wind, rain, snow, clouds, lightning, sound }
 *   onToggle — Callback: (key: string, value: boolean) => void
 *
 * Each toggle key maps to either:
 *   - A CSS weather layer class in globals.css (rain, snow, wind, clouds, lightning)
 *   - A JS-driven feature in page.jsx (pterodactyl, sound)
 *
 * To add a new toggle:
 *   1. Add an entry to the TOGGLES array below
 *   2. Add a default value in DEFAULT_OPTIONS (page.jsx)
 *   3. Create the CSS class / JS handler for the effect
 */

/** Toggle definitions — order here = order in drawer UI */
const TOGGLES = [
  { key: 'pterodactyl', label: 'Pterodactyl', iconSrc: '/pterodactyl-right-flapping.svg' },
  { key: 'wind', label: 'Wind', icon: '💨' },
  { key: 'rain', label: 'Rain', icon: '🌧️' },
  { key: 'snow', label: 'Snow', icon: '❄️' },
  { key: 'clouds', label: 'Clouds', icon: '☁️' },
  { key: 'lightning', label: 'Lightning', icon: '⚡' },
  { key: 'sound', label: 'Sound', icon: '🔊' },
];

/** Range/slider definitions — order here = order in drawer UI (rendered after toggles) */
const RANGES = [
  { key: 'shootingStars', label: 'Shooting Stars', icon: '🌠', min: 0, max: 3, step: 1 },
];

export default function OptionsDrawer({ options, onToggle }) {
  const [open, setOpen] = useState(false);

  /* Close drawer on Escape key */
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Backdrop — dims page when drawer is open (tap/click to close) */}
      {open && (
        <div
          className="options-drawer-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer container — slides in/out via CSS translateX */}
      <div className={`options-drawer-container${open ? ' is-open' : ''}`}>
        {/* Tab handle — always accessible on right edge of viewport */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="options-drawer-tab"
          aria-label={open ? 'Close options panel' : 'Open options panel'}
        >
          ⚙ Options
        </button>

        {/* Panel body */}
        <div className="options-drawer-panel">
          <h2 className="options-drawer-title">Options</h2>

          <div className="options-toggle-list">
            {TOGGLES.map(({ key, label, icon, iconSrc }) => (
              <label key={key} className="options-toggle-row">
                <span className="options-toggle-label">
                  <span className="options-toggle-icon">
                    {iconSrc ? (
                      <img
                        src={iconSrc}
                        alt=""
                        width={22}
                        height={22}
                        style={{ display: 'block' }}
                      />
                    ) : (
                      icon
                    )}
                  </span>
                  {label}
                </span>

                {/* Visually-hidden checkbox drives the toggle state */}
                <input
                  type="checkbox"
                  checked={!!options[key]}
                  onChange={() => onToggle(key, !options[key])}
                  className="sr-only"
                  role="switch"
                  aria-checked={!!options[key]}
                  aria-label={`Toggle ${label}`}
                />

                {/* Visual switch track + knob (iOS-style) */}
                <div className={`options-switch-track${options[key] ? ' is-on' : ''}`}>
                  <div className="options-switch-knob" />
                </div>
              </label>
            ))}

            {RANGES.map(({ key, label, icon, min, max, step }) => (
              <label key={key} className="options-toggle-row">
                <span className="options-toggle-label">
                  <span className="options-toggle-icon">{icon}</span>
                  {label}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={options[key] ?? min}
                    onChange={(e) => onToggle(key, Number(e.target.value))}
                    aria-label={`${label} count`}
                    style={{ width: '80px', accentColor: '#818cf8' }}
                  />
                  <span
                    style={{
                      minWidth: '16px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text, #f9fafb)',
                    }}
                  >
                    {options[key] ?? min}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
