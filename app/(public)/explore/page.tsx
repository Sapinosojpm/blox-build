'use client';

import { useState } from 'react';
import { useBuildStore } from '@/store/useBuildStore';
import { useAuthStore } from '@/store/useAuthStore';
import BuildCard from '@/components/cards/BuildCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Compass, Search, Filter, RotateCcw, DollarSign, X } from 'lucide-react';

const CATEGORIES = ['All', 'Modern Mansion', 'Suburban Family Home', 'Cozy Cottage', 'Cafe / Restaurant', 'City / Town Roleplay', 'Hotel / Resort'];
const STYLES = ['All', 'Aesthetic', 'Linen', 'Minimalist', 'Industrial', 'Blush', 'Rustic', 'Modern'];

export default function ExplorePage() {
  const { builds, filters, setFilters, resetFilters, isLoading } = useBuildStore();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleCategoryChange = (cat: string) => {
    setFilters({ category: cat });
  };

  const handleStyleChange = (style: string) => {
    setFilters({ style: style });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ sortBy: e.target.value as any });
  };

  const handleBudgetMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ budgetMax: parseInt(e.target.value || '0', 10) });
  };

  // Perform client-side filtering on builds
  const filteredBuilds = builds.filter((build) => {
    // Search filter
    const matchesSearch =
      build.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      build.description.toLowerCase().includes(filters.search.toLowerCase());

    // Category filter
    const matchesCategory =
      filters.category === 'All' || build.category === filters.category;

    // Style filter
    const matchesStyle =
      filters.style === 'All' || build.style === filters.style;

    // Budget filter
    const matchesBudget =
      build.budget >= filters.budgetMin &&
      (filters.budgetMax >= 2000000 ? true : build.budget <= filters.budgetMax);

    return matchesSearch && matchesCategory && matchesStyle && matchesBudget;
  }).sort((a, b) => {
    if (filters.sortBy === 'popular') {
      return b.likes_count - a.likes_count;
    }
    if (filters.sortBy === 'budget') {
      return b.budget - a.budget;
    }
    // Default latest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Reusable Filter Contents
  const FilterFields = () => (
    <>
      {/* Search Query */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
          Search Keywords
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search mansion, cabin..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2.5 bg-[#111622] rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-blox-cyan transition-colors"
          />
          <Search size={14} className="absolute left-3 top-3.5 text-gray-500" />
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
          Category
        </label>
        <div className="flex flex-col gap-1.5 mt-1 max-h-[160px] overflow-y-auto pr-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCategoryChange(c)}
              className={`text-left text-xs font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                filters.category === c
                  ? 'bg-blox-cyan/10 border-blox-cyan/30 text-blox-cyan'
                  : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Style Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
          Build Style
        </label>
        <div className="flex flex-col gap-1.5 mt-1 max-h-[160px] overflow-y-auto pr-1">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() => handleStyleChange(s)}
              className={`text-left text-xs font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                filters.style === s
                  ? 'bg-blox-cyan/10 border-blox-cyan/30 text-blox-cyan'
                  : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Limit Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-wider">
          <span>Budget Cap</span>
          <span className="text-emerald-400 font-bold">
            {filters.budgetMax >= 2000000 ? 'No Limit' : `$${(filters.budgetMax / 1000).toFixed(0)}k Max`}
          </span>
        </div>
        <input
          type="range"
          min="50000"
          max="2000000"
          step="50000"
          value={filters.budgetMax}
          onChange={handleBudgetMaxChange}
          className="w-full accent-blox-cyan cursor-pointer h-1.5 bg-[#111622] rounded-lg border border-white/5"
        />
      </div>

      {/* Sort Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
          Sort Sequence
        </label>
        <select
          value={filters.sortBy}
          onChange={handleSortChange}
          className="w-full px-4 py-2.5 bg-[#111622] rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-blox-cyan transition-colors"
        >
          <option value="latest">Latest uploads</option>
          <option value="popular">Most popular likes</option>
          <option value="budget">Highest Budget</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* Title */}
      <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left border-b border-white/5 pb-6">
        <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Compass className="text-blox-cyan" size={32} />
          Explore Creations
        </h1>
        <p className="text-xs text-gray-500 font-bold uppercase">
          Browse the ultimate database of custom designs built by elite Roblox engineers
        </p>
      </div>

      {/* Filter Sidebar & Toolbar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Panel - Left Side (Hidden on Mobile, Visible on LG and up) */}
        <div className="hidden lg:flex p-6 rounded-2xl glass-panel border border-white/5 flex flex-col gap-6 h-fit sticky top-24">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Filter size={16} className="text-blox-cyan" />
              Filters
            </span>
            <button
              onClick={resetFilters}
              className="text-[10px] text-gray-500 hover:text-white transition-colors flex items-center gap-1 font-bold uppercase cursor-pointer"
            >
              <RotateCcw size={10} />
              Reset All
            </button>
          </div>
          <FilterFields />
        </div>

        {/* Right Side: Grid of filtered creations */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-blox-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredBuilds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBuilds.map((build) => (
                <BuildCard key={build.id} build={build} />
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white/5 border border-white/5 rounded-3xl text-sm text-gray-500 font-bold max-w-lg mx-auto mt-10">
              🔍 No creations match your current exploration filter settings. Try resetting or tweaking your budget cap sliders!
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Toggle Button */}
      <button
        onClick={() => setIsMobileFiltersOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center gap-2 bg-blox-cyan text-blox-dark font-extrabold uppercase text-xs px-5 py-3.5 rounded-full shadow-2xl shadow-blox-cyan/20 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 border border-white/10"
      >
        <Filter size={14} />
        Filters {filteredBuilds.length > 0 && `(${filteredBuilds.length})`}
      </button>

      {/* Mobile Filters Drawer Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-[#0B0E14]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm h-full bg-[#0B0E14] border-l border-white/5 p-6 overflow-y-auto flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Filter size={16} className="text-blox-cyan" />
                Filters
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={resetFilters}
                  className="text-[10px] text-gray-500 hover:text-white transition-colors flex items-center gap-1 font-bold uppercase cursor-pointer"
                >
                  <RotateCcw size={10} />
                  Reset
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <FilterFields />

            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full bg-blox-cyan text-blox-dark font-extrabold uppercase text-xs py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer mt-4 shadow-lg shadow-blox-cyan/15"
            >
              Show {filteredBuilds.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
