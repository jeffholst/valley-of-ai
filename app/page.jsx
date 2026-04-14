'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DonateModal from '@/components/DonateModal';
import GalleryFilters from '@/components/GalleryFilters';
import GalleryGrid from '@/components/GalleryGrid';
import GalleryPagination, { PER_PAGE_OPTIONS } from '@/components/GalleryPagination';
import OptionsDrawer from '@/components/OptionsDrawer';
import PaymentSuccessModal from '@/components/PaymentSuccessModal';
import PterodactylSky from '@/components/PterodactylSky';
import { usePterodactyls } from '@/hooks/usePterodactyls';
import { useAllVoteCounts } from '@/hooks/useVotes';
import { trendingScore } from '@/lib/trendingScore';
import appsData from '@/data/apps.json';

const OPTIONS_STORAGE_KEY = 'voa-page-options';
const FILTERS_STORAGE_KEY = 'voa-gallery-filters';

const DEFAULT_FILTERS = {
  searchQuery: '',
  categoryFilter: '',
  agentFilter: '',
  modelFilter: '',
  inputModeFilter: '',
  sortBy: 'newest',
  currentPage: 1,
  perPage: PER_PAGE_OPTIONS[0],
};

const DEFAULT_OPTIONS = {
  pterodactyl: true,
  shootingStars: 1,
  wind: false,
  rain: false,
  snow: false,
  clouds: false,
  lightning: false,
  earthquake: false,
};

const allAppIds = appsData.map((app) => app.id);

export default function HomePage() {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentType, setPaymentType] = useState('tip');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [mounted, setMounted] = useState(false);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [inputModeFilter, setInputModeFilter] = useState('');

  const { pterodactyls, handleKill } = usePterodactyls();
  const { voteCounts, isLoading: _votesLoading } = useAllVoteCounts(allAppIds);

  // Open donate modal if ?donate=1 is in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('donate') === '1') {
      setShowDonateModal(true);
      params.delete('donate');
      const newSearch = params.toString();
      window.history.replaceState(
        {},
        '',
        newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname
      );
    }
  }, []);

  // Detect Stripe redirect and show payment success modal after server verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipped = params.get('tipped');
    const sessionId = params.get('session_id');
    if ((tipped === 'tip' || tipped === 'donation') && sessionId) {
      fetch(`/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => (res.ok ? res.json().catch(() => null) : null))
        .then((data) => {
          if (data?.success) {
            setPaymentType(tipped);
            setShowPaymentSuccess(true);
            window.history.replaceState({}, '', window.location.pathname);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Hydrate client-only state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (saved) {
      try {
        setOptions((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {
        /* ignore corrupt data */
      }
    } else {
      const legacy = localStorage.getItem('pterodactyl-animations-enabled-v2');
      const isMobile =
        window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
        window.matchMedia('(max-width: 768px)').matches;
      const pteroOn = legacy !== null ? legacy === 'true' : !isMobile;
      setOptions((prev) => ({ ...prev, pterodactyl: pteroOn }));
    }

    // Hydrate gallery filters
    const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (savedFilters) {
      try {
        const f = { ...DEFAULT_FILTERS, ...JSON.parse(savedFilters) };
        setSearchQuery(f.searchQuery);
        setCategoryFilter(f.categoryFilter);
        setAgentFilter(f.agentFilter);
        setModelFilter(f.modelFilter);
        setInputModeFilter(f.inputModeFilter);
        setSortBy(f.sortBy);
        setPerPage(PER_PAGE_OPTIONS.includes(f.perPage) ? f.perPage : DEFAULT_FILTERS.perPage);
        setCurrentPage(Math.max(1, f.currentPage));
      } catch {
        /* ignore corrupt data */
      }
    }

    setMounted(true);
  }, []);

  // Persist options to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options));
    }
  }, [options, mounted]);

  // Persist gallery filters to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({
          searchQuery,
          categoryFilter,
          agentFilter,
          modelFilter,
          inputModeFilter,
          sortBy,
          currentPage,
          perPage,
        })
      );
    }
  }, [
    searchQuery,
    categoryFilter,
    agentFilter,
    modelFilter,
    inputModeFilter,
    sortBy,
    currentPage,
    perPage,
    mounted,
  ]);

  const filteredApps = useMemo(() => {
    return appsData.filter((app) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !app.name?.toLowerCase().includes(q) &&
          !app.shortDescription?.toLowerCase().includes(q) &&
          !app.tags?.some((t) => t.toLowerCase().includes(q))
        ) {
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
    if (sortBy === 'oldest') {
      return apps.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    if (sortBy === 'highest') {
      return apps.sort((a, b) => (voteCounts[b.id]?.net ?? 0) - (voteCounts[a.id]?.net ?? 0));
    }
    if (sortBy === 'trending') {
      const now = Date.now();
      return apps.sort((a, b) => {
        const scoreA = trendingScore(a.createdAt, voteCounts[a.id]?.recentNet ?? 0, now);
        const scoreB = trendingScore(b.createdAt, voteCounts[b.id]?.recentNet ?? 0, now);
        return scoreB - scoreA;
      });
    }
    return apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [filteredApps, sortBy, voteCounts]);

  const totalPages = Math.max(1, Math.ceil(sortedApps.length / perPage));

  // Clamp currentPage when filters/data change and saved page exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedApps = useMemo(() => {
    const start = (Math.min(currentPage, totalPages) - 1) * perPage;
    return sortedApps.slice(start, start + perPage);
  }, [sortedApps, currentPage, totalPages, perPage]);

  const activeFilterCount = [
    categoryFilter,
    agentFilter,
    modelFilter,
    inputModeFilter,
    searchQuery,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setAgentFilter('');
    setModelFilter('');
    setInputModeFilter('');
    setCurrentPage(1);
    setSortBy(DEFAULT_FILTERS.sortBy);
    setPerPage(DEFAULT_FILTERS.perPage);
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOptionToggle = (key, value) => setOptions((prev) => ({ ...prev, [key]: value }));

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

      {mounted && options.rain && <div className="weather-rain" aria-hidden="true" />}
      {mounted && options.snow && <div className="weather-snow" aria-hidden="true" />}
      {mounted && options.wind && <div className="weather-wind" aria-hidden="true" />}
      {mounted && options.clouds && <div className="weather-clouds" aria-hidden="true" />}
      {mounted && options.lightning && <div className="weather-lightning" aria-hidden="true" />}

      {mounted && options.pterodactyl && (
        <PterodactylSky pterodactyls={pterodactyls} onKill={handleKill} />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
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

        <GalleryFilters
          searchQuery={searchQuery}
          onSearchChange={handleFilterChange(setSearchQuery)}
          categoryFilter={categoryFilter}
          onCategoryChange={handleFilterChange(setCategoryFilter)}
          agentFilter={agentFilter}
          onAgentChange={handleFilterChange(setAgentFilter)}
          modelFilter={modelFilter}
          onModelChange={handleFilterChange(setModelFilter)}
          inputModeFilter={inputModeFilter}
          onInputModeChange={handleFilterChange(setInputModeFilter)}
          activeFilterCount={activeFilterCount}
          onReset={resetFilters}
        />

        <GalleryPagination
          apps={sortedApps}
          sortedAppsCount={sortedApps.length}
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          sortBy={sortBy}
          onPageChange={goToPage}
          onPerPageChange={(val) => {
            setPerPage(val);
            setCurrentPage(1);
          }}
          onSortChange={(val) => {
            setSortBy(val);
            setCurrentPage(1);
          }}
        />

        <GalleryGrid
          apps={paginatedApps}
          voteCounts={voteCounts}
          earthquake={options.earthquake}
          hasFilters={activeFilterCount > 0 || !!searchQuery}
          onResetFilters={resetFilters}
        />

        <GalleryPagination
          apps={sortedApps}
          navigationOnly
          sortedAppsCount={sortedApps.length}
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          sortBy={sortBy}
          onPageChange={goToPage}
          onPerPageChange={(val) => {
            setPerPage(val);
            setCurrentPage(1);
          }}
          onSortChange={(val) => {
            setSortBy(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {mounted && <OptionsDrawer options={options} onToggle={handleOptionToggle} />}
      {showDonateModal && <DonateModal onClose={() => setShowDonateModal(false)} />}
      {showPaymentSuccess && (
        <PaymentSuccessModal type={paymentType} onClose={() => setShowPaymentSuccess(false)} />
      )}
    </>
  );
}
