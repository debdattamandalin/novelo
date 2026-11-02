'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Star,
  Layers,
  Sparkles,
  X,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Novel } from '@/utils/supabaseNovels';
import { getAllProgress, ReadingProgress } from '@/utils/progress';
import { getNovelsFromDB } from '@/utils/supabaseNovels';

export default function NovelsDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [novelsList, setNovelsList] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingMap, setReadingMap] = useState<Record<string, ReadingProgress>>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // Retrieve novels directly from Supabase database
      const dbNovels = await getNovelsFromDB();
      setNovelsList(dbNovels);

      // Retrieve reading progress from Supabase database
      const progress = await getAllProgress();
      setReadingMap(progress);
      setLoading(false);
    }
    loadData();
  }, []);

  const categories = [
    'All',
    'Mystery & Supernatural',
    'Apocalyptic & System',
    'Progression & Dark Fantasy',
    'Eastern Cultivation',
    'Isekai & Progression'
  ];

  // Filter novels by search and genre/category
  const filteredNovels = useMemo(() => {
    return novelsList.filter((novel) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        novel.title.toLowerCase().includes(q) ||
        novel.author.toLowerCase().includes(q) ||
        novel.aspectSubtitle.toLowerCase().includes(q) ||
        novel.category.toLowerCase().includes(q) ||
        novel.tags.some((t) => t.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedCategory === 'All') return true;
      return novel.category.toLowerCase().includes(selectedCategory.toLowerCase().slice(0, 8));
    });
  }, [novelsList, searchQuery, selectedCategory]);

  return (
    <div>
      {/* Top Header */}
      <header className="top-nav">
        <Link href="/" className="brand-section">
          <div className="brand-logo">N</div>
          <span className="brand-name">Novelo</span>
        </Link>

        <div className="nav-actions">
          <button className="nav-circle-btn" title="Quick Search" aria-label="Search">
            <Search size={18} />
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="page-container">
        {/* Large Hero Search Section */}
        <div className="hero-search-section">
          <p className="hero-welcome-badge">
            <Sparkles size={14} />
            <span>Welcome to the place with user generated novels</span>
          </p>

          <h1 className="hero-main-title">
            Discover, Read & Explore Novels
          </h1>

          <div className="large-search-bar">
            <Search size={20} className="large-search-icon" />
            <input
              type="text"
              className="large-search-input"
              placeholder="Search by novel title, author, genre or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
            <button
              className="large-filter-btn"
              onClick={() => setSelectedCategory(selectedCategory === 'All' ? 'Mystery & Supernatural' : 'All')}
            >
              <Filter size={16} />
              <span>Filters</span>
              {selectedCategory !== 'All' && (
                <span className="active-filter-indicator">1</span>
              )}
            </button>
          </div>

          {/* Category Filter Chips directly under search */}
          <div className="category-chips-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Counter showing results */}
        <p className="showing-counter" style={{ textAlign: 'center', marginBottom: 32 }}>
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={16} className="animate-spin" /> Fetching novels from Supabase database...
            </span>
          ) : (
            <>Showing <strong>{filteredNovels.length}</strong> database-loaded novels</>
          )}
        </p>

        {/* 3-Column Card Grid */}
        <div className="novel-grid">
          {filteredNovels.map((novel) => {
            const userProgress = readingMap[novel.id];
            const progressPercent = userProgress
              ? Math.min(100, Math.round((userProgress.chapterNumber / novel.totalChapters) * 100))
              : 0;

            return (
              <Link
                key={novel.id}
                href={`/novel/${novel.id}`}
                className="novel-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {/* Media with top-left badge and bottom-right pill */}
                <div className="card-media">
                  {novel.coverImage ? (
                    <img
                      src={novel.coverImage}
                      alt={novel.title}
                      className="card-img"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: '#f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        gap: '6px'
                      }}
                    >
                      <ImageIcon size={32} strokeWidth={1.5} color="#cbd5e1" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>No Image</span>
                    </div>
                  )}
                  {novel.badge && (
                    <span className="badge-top-left">{novel.badge}</span>
                  )}
                  <span className="badge-bottom-right">
                    <Layers size={13} />
                    <span>{novel.volumes} Volumes</span>
                  </span>
                </div>

                {/* Green Format Pill */}
                <div className="card-header-meta">
                  <span className="format-pill">{novel.formatBadge}</span>
                </div>

                {/* Title & Aspect (Mono font) */}
                <h3 className="card-title">{novel.title}</h3>
                <p className="card-aspect">{novel.aspectSubtitle}</p>

                {/* Short synopsis description */}
                <p className="card-description">{novel.description}</p>

                {/* Reading Progress indicator if user has read this novel */}
                {userProgress && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="card-progress-bar-container">
                      <div
                        className="card-progress-bar-fill"
                        style={{ width: `${Math.max(5, progressPercent)}%` }}
                      />
                    </div>
                    <div className="card-progress-label">
                      <span>Reading Ch. {userProgress.chapterNumber}</span>
                      <span>{progressPercent}% completed</span>
                    </div>
                  </div>
                )}

                {/* Features list (Fresh format + Rating) */}
                <div className="features-list">
                  <div className="feature-line green">
                    <Sparkles size={14} />
                    <span>Verified translation • Full chapters ({novel.totalChapters})</span>
                  </div>
                  <div className="feature-line rating">
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span>
                      <strong>{novel.rating}</strong> ({novel.reviewCount} reviews) • By {novel.author}
                    </span>
                  </div>
                </div>

                {/* Selectable Finishes / Editions bottom */}
                <span className="selectable-finishes-title">AVAILABLE FORMATS & EDITIONS:</span>
                <div className="finishes-pills">
                  {novel.editions.map((ed) => (
                    <span key={ed.name} className="finish-pill">
                      {ed.name} ({ed.price})
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
