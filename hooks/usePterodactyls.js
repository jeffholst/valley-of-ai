'use client';

import { useEffect, useRef, useState } from 'react';

const PTERODACTYL_CONFIG = {
  total_desktop: 12,
  total_mobile: 5,
  minSizePx: 56,
  maxSizePx: 120,
  minSpeedSeconds_desktop: 14,
  maxSpeedSeconds_desktop: 34,
  minSpeedSeconds_mobile: 8,
  maxSpeedSeconds_mobile: 18,
  minTopVh: -2,
  maxTopVh: 92,
  killAnimationMs: 650,
};

const randomInRange = (min, max) => Math.random() * (max - min) + min;

const createPterodactyl = (id, isMobile = false) => {
  const fliesLeft = Math.random() < 0.5;
  const minSpeed = isMobile
    ? PTERODACTYL_CONFIG.minSpeedSeconds_mobile
    : PTERODACTYL_CONFIG.minSpeedSeconds_desktop;
  const maxSpeed = isMobile
    ? PTERODACTYL_CONFIG.maxSpeedSeconds_mobile
    : PTERODACTYL_CONFIG.maxSpeedSeconds_desktop;

  return {
    id,
    direction: fliesLeft ? 'left' : 'right',
    topVh: randomInRange(PTERODACTYL_CONFIG.minTopVh, PTERODACTYL_CONFIG.maxTopVh),
    sizePx: randomInRange(PTERODACTYL_CONFIG.minSizePx, PTERODACTYL_CONFIG.maxSizePx),
    speedSeconds: randomInRange(minSpeed, maxSpeed),
    delaySeconds: randomInRange(-45, 0),
    dead: false,
  };
};

const isLikelyMobileDevice = () => {
  if (typeof window === 'undefined') {return false;}
  const hasTouchInput = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallViewport = window.matchMedia('(max-width: 768px)').matches;
  return hasTouchInput || smallViewport;
};

/**
 * Manages pterodactyl state: initialization, click-to-kill, and respawn.
 * Returns { pterodactyls, isMobile, handleKill }.
 */
export function usePterodactyls() {
  const [pterodactyls, setPterodactyls] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);
  const respawnTimersRef = useRef(new Map());

  useEffect(() => {
    const mobile = isLikelyMobileDevice();
    isMobileRef.current = mobile;
    setIsMobile(mobile);
    const count = mobile ? PTERODACTYL_CONFIG.total_mobile : PTERODACTYL_CONFIG.total_desktop;
    setPterodactyls(Array.from({ length: count }, (_, i) => createPterodactyl(`ptero-${i + 1}`, mobile)));
  }, []);

  useEffect(() => {
    return () => {
      respawnTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      respawnTimersRef.current.clear();
    };
  }, []);

  const handleKill = (pterodactylId) => {
    setPterodactyls((prev) => {
      let shouldScheduleRespawn = false;
      const next = prev.map((p) => {
        if (p.id !== pterodactylId || p.dead) {return p;}
        shouldScheduleRespawn = true;
        return { ...p, dead: true };
      });

      if (shouldScheduleRespawn && !respawnTimersRef.current.has(pterodactylId)) {
        const timerId = window.setTimeout(() => {
          respawnTimersRef.current.delete(pterodactylId);
          setPterodactyls((current) =>
            current.map((p) =>
              p.id === pterodactylId ? createPterodactyl(pterodactylId, isMobileRef.current) : p
            )
          );
        }, PTERODACTYL_CONFIG.killAnimationMs);
        respawnTimersRef.current.set(pterodactylId, timerId);
      }

      return next;
    });
  };

  return { pterodactyls, isMobile, handleKill };
}
