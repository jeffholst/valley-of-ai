'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import AppCard from '@/components/AppCard';
import OptionsDrawer from '@/components/OptionsDrawer';
import DonateModal from '@/components/DonateModal';
import PaymentSuccessModal from '@/components/PaymentSuccessModal';
import { useAllVoteCounts } from '@/hooks/useVotes';

// Import apps data — synced from legacy root
import appsData from '@/data/apps.json';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest rated' },
];

const PER_PAGE_OPTIONS = [10, 25, 100];
/**
 * localStorage key for all page options (JSON object).
 * Replaces the legacy single-toggle 'pterodactyl-animations-enabled-v2' key.
 */
const OPTIONS_STORAGE_KEY = 'voa-page-options';

/** Default option values — pterodactyl defaults on for desktop, all others off */
const DEFAULT_OPTIONS = {
  pterodactyl: true,
  shootingStars: 1,
  wind: false,
  rain: false,
  snow: false,
  clouds: false,
  lightning: false,
  sound: false,
};

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

const createInitialPterodactyls = (isMobile) => {
  const count = isMobile ? PTERODACTYL_CONFIG.total_mobile : PTERODACTYL_CONFIG.total_desktop;
  return Array.from({ length: count }, (_, index) =>
    createPterodactyl(`ptero-${index + 1}`, isMobile)
  );
};

const isLikelyMobileDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  const hasTouchInput = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallViewport = window.matchMedia('(max-width: 768px)').matches;
  return hasTouchInput || smallViewport;
};

// Extract unique filter options from data
const categories = [...new Set(appsData.map((app) => app.category).filter(Boolean))].sort();
const agents = [
  ...new Set(appsData.map((app) => app.generation?.agentName).filter(Boolean)),
].sort();
const models = [...new Set(appsData.map((app) => app.generation?.llmModel).filter(Boolean))].sort();
const INPUT_MODE_OPTIONS = ['Desktop', 'Mobile', 'Responsive'];
const allAppIds = appsData.map((app) => app.id);

export default function HomePage() {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentType, setPaymentType] = useState('tip');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  /** All visual/audio effect toggles — synced to localStorage */
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [pterodactyls, setPterodactyls] = useState([]);
  const respawnTimersRef = useRef(new Map());
  /** Web Audio API context for ambient sound */
  const audioCtxRef = useRef(null);

  // Fetch vote counts from Supabase
  const { voteCounts, isLoading: _votesLoading } = useAllVoteCounts(allAppIds);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [inputModeFilter, setInputModeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    categoryFilter,
    agentFilter,
    modelFilter,
    inputModeFilter,
    searchQuery,
  ].filter(Boolean).length;

  // Open donate modal if ?donate=1 is in the URL (e.g. from README link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('donate') === '1') {
      setShowDonateModal(true);
      params.delete('donate');
      const newSearch = params.toString();
      const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Detect Stripe redirect and conditionally show payment success modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipped = params.get('tipped');
    const sessionId = params.get('session_id');

    // Only attempt to show success after server-side verification of the session
    if ((tipped === 'tip' || tipped === 'donation') && sessionId) {
      fetch(`/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => {
          if (!res.ok) {
            return null;
          }
          return res.json().catch(() => null);
        })
        .then((data) => {
          if (data && data.success) {
            setPaymentType(tipped);
            setShowPaymentSuccess(true);
            window.history.replaceState({}, '', window.location.pathname);
          }
        })
        .catch(() => {
          // Silently ignore verification errors; do not show success modal
        });
    }
  }, []);

  // Hydrate client-only state
  useEffect(() => {
    const mobile = isLikelyMobileDevice();
    setIsMobile(mobile);
    // Load saved options; migrate legacy pterodactyl key if present
    const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (saved) {
      try {
        setOptions((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {
        /* ignore corrupt data */
      }
    } else {
      const legacy = localStorage.getItem('pterodactyl-animations-enabled-v2');
      const pteroOn = legacy !== null ? legacy === 'true' : !mobile;
      setOptions((prev) => ({ ...prev, pterodactyl: pteroOn }));
    }
    setPterodactyls(createInitialPterodactyls(mobile));
    setMounted(true);
  }, []);

  const filteredApps = useMemo(() => {
    return appsData.filter((app) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          app.name?.toLowerCase().includes(query) ||
          app.shortDescription?.toLowerCase().includes(query) ||
          app.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) {
          return false;
        }
      }
      if (categoryFilter && app.category !== categoryFilter) {
        return false;
      }
      if (agentFilter && app.generation?.agentName !== agentFilter) {
        return false;
      }
      if (modelFilter && app.generation?.llmModel !== modelFilter) {
        return false;
      }
      if (
        inputModeFilter &&
        (app.inputMode || '').toLowerCase() !== inputModeFilter.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [searchQuery, categoryFilter, agentFilter, modelFilter, inputModeFilter]);

  const sortedApps = useMemo(() => {
    const apps = [...filteredApps];
    switch (sortBy) {
      case 'newest':
        return apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return apps.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'highest':
        return apps.sort((a, b) => (voteCounts[b.id]?.net ?? 0) - (voteCounts[a.id]?.net ?? 0));
      default:
        return apps;
    }
  }, [filteredApps, sortBy, voteCounts]);

  const totalPages = Math.ceil(sortedApps.length / perPage);

  const paginatedApps = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return sortedApps.slice(startIndex, startIndex + perPage);
  }, [sortedApps, currentPage, perPage]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setAgentFilter('');
    setModelFilter('');
    setInputModeFilter('');
    setCurrentPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleKillPterodactyl = (pterodactylId) => {
    setPterodactyls((prev) => {
      let shouldScheduleRespawn = false;

      const next = prev.map((pterodactyl) => {
        if (pterodactyl.id !== pterodactylId || pterodactyl.dead) {
          return pterodactyl;
        }
        shouldScheduleRespawn = true;
        return { ...pterodactyl, dead: true };
      });

      if (shouldScheduleRespawn && !respawnTimersRef.current.has(pterodactylId)) {
        const timerId = window.setTimeout(() => {
          respawnTimersRef.current.delete(pterodactylId);
          setPterodactyls((current) =>
            current.map((pterodactyl) =>
              pterodactyl.id === pterodactylId
                ? createPterodactyl(pterodactylId, isMobile)
                : pterodactyl
            )
          );
        }, PTERODACTYL_CONFIG.killAnimationMs);

        respawnTimersRef.current.set(pterodactylId, timerId);
      }

      return next;
    });
  };

  useEffect(() => {
    return () => {
      respawnTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      respawnTimersRef.current.clear();
    };
  }, []);

  /** Persist all options to localStorage whenever they change */
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options));
    }
  }, [options, mounted]);

  /** Toggle a single option by key */
  const handleOptionToggle = (key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Ambient sound — generates brown noise via Web Audio API.
   * Created on first enable, suspended/resumed on subsequent toggles.
   */
  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (options.sound) {
      if (!audioCtxRef.current) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const len = ctx.sampleRate * 2;
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const data = buf.getChannelData(0);
          let last = 0;
          for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (last + 0.02 * white) / 1.02;
            last = data[i];
            data[i] *= 3.5;
          }
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          const gain = ctx.createGain();
          gain.gain.value = 0.07;
          src.connect(gain);
          gain.connect(ctx.destination);
          src.start();
          audioCtxRef.current = ctx;
        } catch {
          /* Web Audio not available */
        }
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } else if (audioCtxRef.current?.state === 'running') {
      audioCtxRef.current.suspend();
    }
  }, [options.sound, mounted]);

  /** Clean up audio context on unmount */
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
        {options.shootingStars >= 1 && <div className="valley-shooting-stars" />}
        {options.shootingStars >= 2 && <div className="valley-shooting-stars-mid" />}
        {options.shootingStars >= 3 && <div className="valley-shooting-stars-low" />}
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      {/* ── Weather effect overlays (CSS-only, see globals.css) ── */}
      {mounted && options.rain && <div className="weather-rain" aria-hidden="true" />}
      {mounted && options.snow && <div className="weather-snow" aria-hidden="true" />}
      {mounted && options.wind && <div className="weather-wind" aria-hidden="true" />}
      {mounted && options.clouds && <div className="weather-clouds" aria-hidden="true" />}
      {mounted && options.lightning && <div className="weather-lightning" aria-hidden="true" />}

      {mounted && options.pterodactyl && (
        <div className="pterodactyl-sky" aria-hidden="true">
          {pterodactyls.map((pterodactyl) => {
            const sprite =
              pterodactyl.direction === 'left'
                ? '/pterodactyl-left-flapping.svg'
                : '/pterodactyl-right-flapping.svg';

            return (
              <div
                key={pterodactyl.id}
                onPointerDown={() => handleKillPterodactyl(pterodactyl.id)}
                className={`pterodactyl-flyer ${pterodactyl.direction === 'left' ? 'pterodactyl-left' : 'pterodactyl-right'}${pterodactyl.dead ? ' is-dead' : ''}`}
                style={{
                  '--ptero-top': `${pterodactyl.topVh}svh`,
                  '--ptero-size': `${pterodactyl.sizePx}px`,
                  '--ptero-speed': `${pterodactyl.speedSeconds}s`,
                  '--ptero-delay': `${pterodactyl.delaySeconds}s`,
                }}
              >
                <img
                  src={sprite}
                  alt=""
                  draggable={false}
                  className={`pterodactyl-sprite${pterodactyl.dead ? ' is-dead' : ''}`}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <p className="text-xl sm:text-2xl text-purple-400 font-medium mb-2">Welcome to the</p>
          <h1 className="text-4xl sm:text-5xl font-bold animated-gradient-text mb-3">
            Valley of AI
          </h1>
          <div className="mb-4">
            <button
              onClick={() => setShowDonateModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-900 bg-gradient-to-r from-amber-300 to-orange-300 hover:from-amber-400 hover:to-orange-400 rounded-full px-3 py-1 transition-all duration-150 hover:scale-105 shadow-sm"
            >
              💡 Keep the lights on
            </button>
          </div>
          <p className="text-lg text-gray-900 dark:text-gray-300 max-w-2xl mx-auto mb-4">
            A new AI-generated app is published every night. Come back daily to discover what our AI
            agents have built — from games to utilities to creative tools.
          </p>
          <p className="text-gray-900 dark:text-gray-300 max-w-2xl mx-auto">
            Vote for your favorites and help shape what gets built next.{' '}
            <Link
              href="/suggest"
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Suggest an app idea
            </Link>{' '}
            and our AI might bring it to life.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search apps by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary-600 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="card p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label htmlFor="categoryFilter" className="label">
                    Category
                  </label>
                  <select
                    id="categoryFilter"
                    value={categoryFilter}
                    onChange={handleFilterChange(setCategoryFilter)}
                    className="input"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="agentFilter" className="label">
                    Agent
                  </label>
                  <select
                    id="agentFilter"
                    value={agentFilter}
                    onChange={handleFilterChange(setAgentFilter)}
                    className="input"
                  >
                    <option value="">All Agents</option>
                    {agents.map((agent) => (
                      <option key={agent} value={agent}>
                        {agent}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="modelFilter" className="label">
                    Model
                  </label>
                  <select
                    id="modelFilter"
                    value={modelFilter}
                    onChange={handleFilterChange(setModelFilter)}
                    className="input"
                  >
                    <option value="">All Models</option>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="inputModeFilter" className="label">
                    Input Mode
                  </label>
                  <select
                    id="inputModeFilter"
                    value={inputModeFilter}
                    onChange={handleFilterChange(setInputModeFilter)}
                    className="input"
                  >
                    <option value="">All Input Modes</option>
                    {INPUT_MODE_OPTIONS.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    disabled={activeFilterCount === 0 && !searchQuery}
                    className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{sortedApps.length}</span>{' '}
            apps available
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="perPage" className="text-sm text-gray-600 dark:text-gray-400">
                Show:
              </label>
              <select
                id="perPage"
                value={perPage}
                onChange={handlePerPageChange}
                className="input py-1.5 w-auto"
              >
                {PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={handleSortChange}
                className="input py-1.5 w-auto"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        {paginatedApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {activeFilterCount > 0 || searchQuery ? (
              <>
                <p className="text-gray-500 dark:text-gray-400 mb-4">No apps match your filters.</p>
                <button onClick={resetFilters} className="btn-secondary">
                  Clear Filters
                </button>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No apps available yet.</p>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * perPage + 1}–
              {Math.min(currentPage * perPage, sortedApps.length)} of {sortedApps.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (page === 1 || page === totalPages) {
                      return true;
                    }
                    if (Math.abs(page - currentPage) <= 1) {
                      return true;
                    }
                    return false;
                  })
                  .reduce((acc, page, idx, arr) => {
                    if (idx > 0 && page - arr[idx - 1] > 1) {
                      acc.push('...');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => goToPage(item)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === item
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Options drawer (right-side pull-out panel) ── */}
      {mounted && <OptionsDrawer options={options} onToggle={handleOptionToggle} />}

      {/* ── Donate modal ── */}
      {showDonateModal && <DonateModal onClose={() => setShowDonateModal(false)} />}

      {/* ── Payment success modal ── */}
      {showPaymentSuccess && (
        <PaymentSuccessModal type={paymentType} onClose={() => setShowPaymentSuccess(false)} />
      )}
    </>
  );
}
