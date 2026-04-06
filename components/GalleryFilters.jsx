'use client';

import { useState } from 'react';
import appsData from '@/data/apps.json';

const categories = [...new Set(appsData.map((app) => app.category).filter(Boolean))].sort();
const agents = [
  ...new Set(appsData.map((app) => app.generation?.agentName).filter(Boolean)),
].sort();
const models = [...new Set(appsData.map((app) => app.generation?.llmModel).filter(Boolean))].sort();
const INPUT_MODE_OPTIONS = ['Desktop', 'Mobile', 'Responsive'];

export default function GalleryFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  agentFilter,
  onAgentChange,
  modelFilter,
  onModelChange,
  inputModeFilter,
  onInputModeChange,
  activeFilterCount,
  onReset,
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="input pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
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
                onChange={(e) => onCategoryChange(e.target.value)}
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
                onChange={(e) => onAgentChange(e.target.value)}
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
                onChange={(e) => onModelChange(e.target.value)}
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
                onChange={(e) => onInputModeChange(e.target.value)}
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
                onClick={onReset}
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
  );
}
