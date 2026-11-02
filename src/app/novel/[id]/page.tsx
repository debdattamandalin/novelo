'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Search,
  Star,
  Layers,
  ChevronDown,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Clock,
  FileText,
  ArrowLeft,
  Share2,
  Bookmark,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Novel, Chapter, getNovelWithVolumesAndChapters, getChapterContentFromDB } from '@/utils/supabaseNovels';
import { getNovelProgress, saveNovelProgress, ReadingProgress } from '@/utils/progress';
import FormattedChapterContent from '@/components/FormattedChapterContent';

export default function NovelDetailPage() {
  const params = useParams();
  const novelId = params?.id as string;

  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'volumes' | 'overview'>('volumes');
  const [expandedVolumes, setExpandedVolumes] = useState<{ [volId: string]: boolean }>({ 'vol-1': true });

  // Currently open reading chapter (full content retrieved from DB)
  const [activeReadingChapter, setActiveReadingChapter] = useState<{
    id: string;
    title: string;
    chapterNumber: number;
    releaseDate: string;
    wordCount: string;
    content: string;
  } | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);

  const [savedProgress, setSavedProgress] = useState<ReadingProgress | null>(null);

  // Fetch Novel + Volumes + Chapters directly from Database
  useEffect(() => {
    async function loadNovelData() {
      setLoading(true);
      const dbNovel = await getNovelWithVolumesAndChapters(novelId);
      if (dbNovel) {
        setNovel(dbNovel);
        // Expand the first volume by default
        if (dbNovel.volumeList.length > 0) {
          setExpandedVolumes({ [dbNovel.volumeList[0].id]: true });
        }
      }

      // Fetch user reading progress from Database
      const prog = await getNovelProgress(novelId);
      if (prog) {
        setSavedProgress(prog);
        setExpandedVolumes((prev) => ({
          ...prev,
          [`vol-${prog.volumeNumber}`]: true,
          [`${novelId}-vol-${prog.volumeNumber}`]: true
        }));
      }
      setLoading(false);
    }
    loadNovelData();
  }, [novelId]);

  // Flatten all chapters across volumes preserving volume structure
  const allChapters = useMemo(() => {
    if (!novel) return [];
    const list: { chapter: Chapter; volumeId: string; volumeNumber: number; volumeTitle: string; isLastInVolume: boolean; nextVolumeTitle?: string }[] = [];
    novel.volumeList.forEach((v, vIndex) => {
      const nextVol = novel.volumeList[vIndex + 1];
      v.chapters.forEach((ch, chIndex) => {
        const isLastInVol = chIndex === v.chapters.length - 1;
        list.push({
          chapter: ch,
          volumeId: v.id,
          volumeNumber: v.volumeNumber,
          volumeTitle: v.title,
          isLastInVolume: isLastInVol,
          nextVolumeTitle: isLastInVol && nextVol ? nextVol.title : undefined
        });
      });
    });
    return list;
  }, [novel]);

  const currentChapterIndex = useMemo(() => {
    if (!activeReadingChapter) return -1;
    return allChapters.findIndex((c) => c.chapter.id === activeReadingChapter.id);
  }, [allChapters, activeReadingChapter]);

  const currentChapterInfo = currentChapterIndex >= 0 ? allChapters[currentChapterIndex] : null;
  const hasPreviousChapter = currentChapterIndex > 0;
  const hasNextChapter = currentChapterIndex >= 0 && currentChapterIndex < allChapters.length - 1;

  // Open chapter: queries full text content from Supabase database table `chapters`
  const openChapterFromDB = async (chapterId: string, volumeId: string, chapterNumber: number, volumeNumber: number) => {
    setLoadingChapter(true);
    const dbChapter = await getChapterContentFromDB(novelId, { chapterId, volumeId, chapterNumber });

    if (dbChapter) {
      setActiveReadingChapter(dbChapter);
      const progressData: ReadingProgress = {
        novelId: novelId,
        chapterId: dbChapter.id,
        chapterNumber: dbChapter.chapterNumber,
        chapterTitle: dbChapter.title,
        volumeNumber,
        updatedAt: Date.now()
      };
      setSavedProgress(progressData);
      await saveNovelProgress(progressData);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setLoadingChapter(false);
  };

  const goToPreviousChapter = () => {
    if (hasPreviousChapter) {
      const prev = allChapters[currentChapterIndex - 1];
      openChapterFromDB(prev.chapter.id, prev.volumeId, prev.chapter.number, prev.volumeNumber);
    }
  };

  const goToNextChapter = () => {
    if (hasNextChapter) {
      const next = allChapters[currentChapterIndex + 1];
      openChapterFromDB(next.chapter.id, next.volumeId, next.chapter.number, next.volumeNumber);
    }
  };

  const resumeReading = () => {
    if (savedProgress) {
      const found = allChapters.find((item) =>
        (savedProgress.chapterId && item.chapter.id === savedProgress.chapterId) ||
        (item.volumeNumber === savedProgress.volumeNumber && item.chapter.number === savedProgress.chapterNumber)
      );
      if (found) {
        openChapterFromDB(found.chapter.id, found.volumeId, found.chapter.number, found.volumeNumber);
        return;
      }
    }
    const first = allChapters[0];
    if (first) {
      openChapterFromDB(first.chapter.id, first.volumeId, first.chapter.number, first.volumeNumber);
    }
  };

  const toggleVolume = (volId: string) => {
    setExpandedVolumes((prev) => ({
      ...prev,
      [volId]: !prev[volId]
    }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={36} className="animate-spin" />
          <p style={{ fontWeight: 600, fontSize: 16 }}>Retrieving novel from Supabase database...</p>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color)', padding: 48, textAlign: 'center' }}>
        <h2>Novel not found in database</h2>
        <Link href="/" className="back-link" style={{ marginTop: 16 }}>
          ← Back to All Novels
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Top Header */}
      <header className="top-nav">
        <Link href="/" className="brand-section">
          <div className="brand-logo">N</div>
          <span className="brand-name">Novelo</span>
        </Link>

        <div className="nav-actions">
          <Link href="/" className="nav-circle-btn" title="Back to Search" aria-label="Search">
            <Search size={18} />
          </Link>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="page-container" style={{ maxWidth: 1040 }}>
        {/* Back navigation */}
        <Link href="/" className="back-link" style={{ marginBottom: 20 }}>
          <ArrowLeft size={16} />
          <span>Back to All Novels</span>
        </Link>

        {/* Reader View: Chapter content loaded from database */}
        {activeReadingChapter ? (
          <div className="volume-card" className="volume-card" style={{ padding: '36px 44px', background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
            {/* Top Navigation Row in Reader */}
            <div className="reader-nav-bar">
              <button
                onClick={() => setActiveReadingChapter(null)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 9999,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Volumes & Chapters</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="chapter-nav-btn"
                  onClick={goToPreviousChapter}
                  disabled={!hasPreviousChapter || loadingChapter}
                  style={{ padding: '6px 14px', fontSize: 13 }}
                  title="Previous Chapter"
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>
                <span className="chapter-indicator-pill">
                  Vol. {currentChapterInfo?.volumeNumber} • Ch. {activeReadingChapter.chapterNumber}
                </span>
                <button
                  className="chapter-nav-btn"
                  onClick={goToNextChapter}
                  disabled={!hasNextChapter || loadingChapter}
                  style={{ padding: '6px 14px', fontSize: 13 }}
                  title="Next Chapter or Volume"
                >
                  <span>
                    {currentChapterInfo?.isLastInVolume && currentChapterInfo.nextVolumeTitle
                      ? 'Next Volume'
                      : 'Next'}
                  </span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="reader-header">
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                {activeReadingChapter.title}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
                {novel.title} • {activeReadingChapter.wordCount} • Released {activeReadingChapter.releaseDate}
              </p>
            </div>

            {loadingChapter ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-main)' }}>
                <Loader2 size={30} className="animate-spin" />
                <p style={{ marginTop: 8, fontSize: 14 }}>Loading chapter from database...</p>
              </div>
            ) : (
              <div className="reader-body">
                {activeReadingChapter.content ? (
                  <FormattedChapterContent content={activeReadingChapter.content} />
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No content available for this chapter.
                  </p>
                )}
              </div>
            )}

            {/* Bottom Previous & Next Chapter / Volume Control Buttons */}
            <div className="chapter-navigation-footer">
              <button
                className="chapter-nav-btn"
                onClick={goToPreviousChapter}
                disabled={!hasPreviousChapter || loadingChapter}
              >
                <ChevronLeft size={18} />
                <span>Previous Chapter</span>
              </button>

              <button
                onClick={() => setActiveReadingChapter(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 13.5,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Table of Contents
              </button>

              {/* Dynamic Next Volume vs Next Chapter Button */}
              {currentChapterInfo?.isLastInVolume && currentChapterInfo.nextVolumeTitle ? (
                <button
                  className="chapter-nav-btn"
                  onClick={goToNextChapter}
                  disabled={loadingChapter}
                  style={{
                    backgroundColor: '#17382d',
                    color: 'white',
                    borderColor: '#17382d',
                    boxShadow: '0 4px 12px rgba(23, 56, 45, 0.2)'
                  }}
                >
                  <span>Next Volume</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  className="chapter-nav-btn"
                  onClick={goToNextChapter}
                  disabled={!hasNextChapter || loadingChapter}
                >
                  <span>Next Chapter</span>
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
            {/* Novel Profile Header */}
            <div className="modal-header-banner" style={{ background: 'var(--surface)', padding: '36px 40px', borderBottom: '1px solid var(--border-subtle)' }}>
              {novel.coverImage ? (
                <img
                  src={novel.coverImage}
                  alt={novel.title}
                  className="modal-cover-thumb"
                  style={{ width: 160, height: 220, borderRadius: 16 }}
                />
              ) : (
                <div
                  className="modal-cover-thumb"
                  style={{
                    width: 160,
                    height: 220,
                    borderRadius: 16,
                    background: 'var(--surface-secondary)',
                    border: '1.5px dashed var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    gap: 8,
                    flexShrink: 0
                  }}
                >
                  <ImageIcon size={36} strokeWidth={1.5} color="#cbd5e1" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>No Cover</span>
                </div>
              )}

              <div className="modal-header-details">
                {/* Saved reading progress banner if available */}
                {savedProgress && (
                  <div className="progress-resume-badge">
                    <Sparkles size={13} />
                    <span>You were reading: Vol. {savedProgress.volumeNumber} • Chapter {savedProgress.chapterNumber}</span>
                  </div>
                )}

                <div className="card-header-meta" style={{ marginBottom: 6 }}>
                  <span className="format-pill">{novel.formatBadge}</span>
                </div>

                <h1 className="modal-novel-title" style={{ fontSize: 34, marginBottom: 6 }}>
                  {novel.title}
                </h1>
                <p className="card-aspect" style={{ fontSize: 13.5, marginBottom: 12 }}>
                  {novel.aspectSubtitle}
                </p>

                <div className="feature-line rating" style={{ fontSize: 14, marginBottom: 20 }}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <span>
                    <strong>{novel.rating}</strong> ({novel.reviewCount} ratings) • By{' '}
                    <strong>{novel.author}</strong> • Status:{' '}
                    <span style={{ color: novel.status === 'Completed' ? '#15803d' : '#2563eb', fontWeight: 700 }}>
                      {novel.status}
                    </span>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {/* Dynamic button: Resume Chapter X or Read Chapter 1 */}
                  {savedProgress ? (
                    <button
                      className="resume-reading-btn"
                      onClick={resumeReading}
                    >
                      <BookOpen size={16} />
                      <span>Continue: Vol. {savedProgress.volumeNumber} Ch. {savedProgress.chapterNumber}</span>
                    </button>
                  ) : (
                    <button
                      className="large-filter-btn"
                      style={{ padding: '10px 22px', fontSize: 14 }}
                      onClick={resumeReading}
                    >
                      <BookOpen size={16} />
                      <span>Read Chapter 1</span>
                    </button>
                  )}

                  <button
                    className="nav-circle-btn"
                    title="Bookmark"
                    style={{ width: 44, height: 44 }}
                  >
                    <Bookmark size={18} />
                  </button>

                  <button
                    className="nav-circle-btn"
                    title="Share"
                    style={{ width: 44, height: 44 }}
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="modal-tabs-bar" style={{ padding: '0 40px' }}>
              <button
                className={`modal-tab-btn ${activeTab === 'volumes' ? 'active' : ''}`}
                onClick={() => setActiveTab('volumes')}
              >
                <Layers size={16} />
                <span>Volumes & Chapters ({novel.volumes} Vols)</span>
              </button>
              <button
                className={`modal-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <FileText size={16} />
                <span>Synopsis & Details</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="modal-content-area" style={{ padding: '32px 40px 48px 40px' }}>
              {activeTab === 'volumes' ? (
                <div>
                  <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13.5, color: 'var(--text-main)', fontWeight: 700 }}>
                      TABLE OF CONTENTS — Organized by Volume
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Total: {novel.totalChapters} Chapters
                    </span>
                  </div>

                  {/* Volume Accordion List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {novel.volumeList.map((vol) => {
                      const isOpen = !!expandedVolumes[vol.id];
                      const isCurrentVolume = savedProgress?.volumeNumber === vol.volumeNumber;

                      return (
                        <div key={vol.id} className={`volume-card ${isOpen ? 'open' : ''}`}>
                          {/* Volume Header (Toggle click) */}
                          <div className="volume-header" onClick={() => toggleVolume(vol.id)}>
                            <div className="volume-header-left">
                              <span className="volume-number-pill">
                                Volume {vol.volumeNumber}
                              </span>
                              <span className="volume-title">{vol.title}</span>
                              {isCurrentVolume && (
                                <span className="chapter-badge-read" style={{ fontSize: 10 }}>
                                  In Progress
                                </span>
                              )}
                            </div>
                            <div className="volume-meta-right">
                              <span>{vol.chapterCount} Chapters</span>
                              {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </div>
                          </div>

                          {/* Chapters inside this volume */}
                          {isOpen && (
                            <div>
                              <div className="volume-description">{vol.description}</div>
                              <div className="chapter-list">
                                {vol.chapters.map((ch) => {
                                  const isLastRead =
                                    (savedProgress?.chapterId && savedProgress.chapterId === ch.id) ||
                                    (savedProgress?.volumeNumber === vol.volumeNumber && savedProgress?.chapterNumber === ch.number);
                                  const isCompleted =
                                    savedProgress &&
                                    (savedProgress.volumeNumber > vol.volumeNumber ||
                                      (savedProgress.volumeNumber === vol.volumeNumber && ch.number < savedProgress.chapterNumber));

                                  return (
                                    <div
                                      key={ch.id}
                                      className={`chapter-row ${isLastRead ? 'currently-reading' : ''}`}
                                      onClick={() => openChapterFromDB(ch.id, vol.id, ch.number, vol.volumeNumber)}
                                    >
                                      <div className="chapter-info-left">
                                        <span className="chapter-number-tag">Ch. {ch.number}</span>
                                        <span className="chapter-title-text">{ch.title}</span>
                                        {isLastRead && (
                                          <span className="chapter-badge-read">
                                            Currently Reading
                                          </span>
                                        )}
                                        {isCompleted && (
                                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600 }}>
                                            <CheckCircle2 size={13} />
                                            <span>Read</span>
                                          </span>
                                        )}
                                      </div>

                                      <div className="chapter-meta-right">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <Clock size={12} />
                                          {ch.releaseDate}
                                        </span>
                                        <span>{ch.wordCount}</span>
                                        <span className="chapter-read-btn">
                                          <span>{isLastRead ? 'Resume' : 'Read'}</span>
                                          <ArrowRight size={12} />
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Synopsis</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: 15, marginBottom: 28 }}>
                    {novel.description}
                  </p>

                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Available Editions & Formats</h3>
                  <div className="finishes-pills" style={{ marginBottom: 28 }}>
                    {novel.editions.map((ed) => (
                      <span key={ed.name} className="finish-pill" style={{ padding: '8px 16px', fontSize: 13 }}>
                        {ed.name} • {ed.price}
                      </span>
                    ))}
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Tags & Themes</h3>
                  <div className="finishes-pills">
                    {novel.tags.map((t) => (
                      <span
                        key={t}
                        className="finish-pill"
                        style={{ background: 'var(--badge-green-bg)', color: 'var(--badge-green-text)', borderColor: 'var(--badge-green-border)', padding: '6px 14px', fontSize: 13 }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
