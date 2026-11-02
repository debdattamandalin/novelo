'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Trash2,
  BookOpen,
  ArrowLeft,
  Lock,
  LogOut,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react';
import {
  Novel,
  Volume,
  Chapter,
  getNovelsFromDB,
  getNovelWithVolumesAndChapters,
  createNovelInDB,
  createVolumeInDB,
  createChapterInDB,
  deleteNovelFromDB,
  deleteVolumeFromDB,
  deleteChapterFromDB
} from '@/utils/supabaseNovels';

export default function AdminPortalPage() {
  // Authentication state (Simple passkey or PIN login for the admin portal)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Main novel & folder explorer state
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Folder expanded state: maps novelId or volumeId to boolean (expanded/collapsed)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  // Deep-loaded novels cache (with volumes and chapters)
  const [novelDetails, setNovelDetails] = useState<Record<string, Novel>>({});

  // Active view: Previewing a chapter or managing
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<{
    novelId: string;
    volumeId: string;
    chapter: Chapter;
  } | null>(null);

  // Modals for creation
  const [isCreateNovelOpen, setIsCreateNovelOpen] = useState(false);
  const [isCreateVolumeOpen, setIsCreateVolumeOpen] = useState<string | null>(null); // novelId
  const [isCreateChapterOpen, setIsCreateChapterOpen] = useState<{
    novelId: string;
    volumeId: string;
  } | null>(null);

  // Form states
  const [newNovelTitle, setNewNovelTitle] = useState('');
  const [newNovelCategory, setNewNovelCategory] = useState('Mystery & Supernatural');
  const [newNovelAuthor, setNewNovelAuthor] = useState('');
  const [newNovelAspect, setNewNovelAspect] = useState('');
  const [newNovelDesc, setNewNovelDesc] = useState('');
  const [newNovelCover, setNewNovelCover] = useState('');

  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  const [newVolumeDesc, setNewVolumeDesc] = useState('');

  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterContent, setNewChapterContent] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check auth session
  useEffect(() => {
    const saved = localStorage.getItem('novelo_admin_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch novels list
  const loadNovels = async () => {
    setLoading(true);
    const dbNovels = await getNovelsFromDB();
    setNovels(dbNovels);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNovels();
    }
  }, [isAuthenticated]);

  // Load complete novel folder details (volumes + chapters) on expand
  const toggleNovelFolder = async (novelId: string) => {
    const isNowExpanded = !expandedFolders[novelId];
    setExpandedFolders((prev) => ({ ...prev, [novelId]: isNowExpanded }));

    if (isNowExpanded && !novelDetails[novelId]) {
      const detailed = await getNovelWithVolumesAndChapters(novelId);
      if (detailed) {
        setNovelDetails((prev) => ({ ...prev, [novelId]: detailed }));
      }
    }
  };

  // Toggle volume folder
  const toggleVolumeFolder = (volumeId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [volumeId]: !prev[volumeId]
    }));
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin access password: 'admin' or 'novelo'
    if (passwordInput === 'admin' || passwordInput === 'novelo' || passwordInput === '1234') {
      setIsAuthenticated(true);
      localStorage.setItem('novelo_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid access key. (Default: admin or novelo)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('novelo_admin_auth');
  };

  // Filter novels
  const filteredNovels = useMemo(() => {
    if (!searchQuery.trim()) return novels;
    const q = searchQuery.toLowerCase().trim();
    return novels.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.author.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
    );
  }, [novels, searchQuery]);

  // Create Novel Handler
  const handleCreateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNovelTitle.trim()) return;
    setActionLoading(true);

    const created = await createNovelInDB({
      title: newNovelTitle.trim(),
      category: newNovelCategory,
      author: newNovelAuthor.trim() || 'Anonymous',
      aspectSubtitle: newNovelAspect.trim() || 'Fantasy / Adventure',
      description: newNovelDesc.trim() || 'A newly published web novel.',
      coverImage: newNovelCover.trim() || ''
    });

    if (created) {
      showToast(`Created novel "${created.title}" successfully!`);
      setNewNovelTitle('');
      setNewNovelAuthor('');
      setNewNovelAspect('');
      setNewNovelDesc('');
      setNewNovelCover('');
      setIsCreateNovelOpen(false);
      await loadNovels();
      // automatically open its folder
      setExpandedFolders((prev) => ({ ...prev, [created.id]: true }));
      const detailed = await getNovelWithVolumesAndChapters(created.id);
      if (detailed) {
        setNovelDetails((prev) => ({ ...prev, [created.id]: detailed }));
      }
    }
    setActionLoading(false);
  };

  // Create Volume Handler
  const handleCreateVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreateVolumeOpen || !newVolumeTitle.trim()) return;
    setActionLoading(true);

    const novelId = isCreateVolumeOpen;
    const createdVol = await createVolumeInDB({
      novelId,
      title: newVolumeTitle.trim(),
      description: newVolumeDesc.trim()
    });

    if (createdVol) {
      showToast(`Volume "${createdVol.title}" added!`);
      setNewVolumeTitle('');
      setNewVolumeDesc('');
      setIsCreateVolumeOpen(null);

      // Refresh this novel's volumes
      const detailed = await getNovelWithVolumesAndChapters(novelId);
      if (detailed) {
        setNovelDetails((prev) => ({ ...prev, [novelId]: detailed }));
      }
      setExpandedFolders((prev) => ({
        ...prev,
        [novelId]: true,
        [createdVol.id]: true
      }));
    }
    setActionLoading(false);
  };

  // Create Chapter Handler
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreateChapterOpen || !newChapterTitle.trim() || !newChapterContent.trim()) return;
    setActionLoading(true);

    const { novelId, volumeId } = isCreateChapterOpen;
    const createdCh = await createChapterInDB({
      novelId,
      volumeId,
      title: newChapterTitle.trim(),
      content: newChapterContent.trim()
    });

    if (createdCh) {
      showToast(`Chapter "${createdCh.title}" created successfully!`);
      setNewChapterTitle('');
      setNewChapterContent('');
      setIsCreateChapterOpen(null);

      // Refresh novel data
      const detailed = await getNovelWithVolumesAndChapters(novelId);
      if (detailed) {
        setNovelDetails((prev) => ({ ...prev, [novelId]: detailed }));
      }
      setSelectedChapter({
        novelId,
        volumeId,
        chapter: createdCh
      });
    }
    setActionLoading(false);
  };

  // Delete Handlers
  const handleDeleteNovel = async (novelId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}" and all its volumes and chapters?`)) {
      setActionLoading(true);
      await deleteNovelFromDB(novelId);
      showToast(`Deleted "${title}"`);
      if (selectedChapter?.novelId === novelId) {
        setSelectedChapter(null);
      }
      await loadNovels();
      setActionLoading(false);
    }
  };

  const handleDeleteVolume = async (volumeId: string, title: string, novelId: string) => {
    if (confirm(`Delete volume "${title}" and all its chapters?`)) {
      setActionLoading(true);
      await deleteVolumeFromDB(volumeId, novelId);
      showToast(`Deleted volume "${title}"`);
      const detailed = await getNovelWithVolumesAndChapters(novelId);
      if (detailed) {
        setNovelDetails((prev) => ({ ...prev, [novelId]: detailed }));
      }
      if (selectedChapter?.volumeId === volumeId) {
        setSelectedChapter(null);
      }
      setActionLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string, title: string, volumeId: string, novelId: string) => {
    if (confirm(`Delete chapter "${title}"?`)) {
      setActionLoading(true);
      await deleteChapterFromDB(chapterId, volumeId, novelId);
      showToast(`Deleted chapter`);
      const detailed = await getNovelWithVolumesAndChapters(novelId);
      if (detailed) {
        setNovelDetails((prev) => ({ ...prev, [novelId]: detailed }));
      }
      if (selectedChapter?.chapter.id === chapterId) {
        setSelectedChapter(null);
      }
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // If not authenticated, render Login Form
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <header className="top-nav">
          <Link href="/" className="brand-section">
            <div className="brand-logo">N</div>
            <span className="brand-name">Novelo</span>
          </Link>
          <Link href="/" className="back-link" style={{ margin: 0 }}>
            ← Public Catalog
          </Link>
        </header>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#eaf5ee',
                  color: '#17382d',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                <Lock size={28} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                Admin Portal
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
                Enter your security passkey to manage novels, volumes, and chapters.
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Passkey / Secret
                </label>
                <input
                  type="password"
                  placeholder="Enter admin password (e.g. admin or novelo)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  autoFocus
                />
              </div>

              {loginError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '13px' }}>
                  <AlertCircle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                style={{
                  backgroundColor: '#17382d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  marginTop: '8px'
                }}
              >
                Sign In to Admin
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
              Connected to Supabase Project: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>novelo</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Authenticated Admin Dashboard Layout
  // -------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#17382d',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            zIndex: 9999
          }}
        >
          <CheckCircle2 size={18} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="top-nav" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" className="brand-section">
            <div className="brand-logo">N</div>
            <span className="brand-name">Novelo</span>
          </Link>
          <span
            style={{
              background: '#eaf5ee',
              color: '#17382d',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={13} />
            Admin Portal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '9999px',
              background: '#f1f5f9'
            }}
          >
            <Eye size={15} />
            View Public Site
          </Link>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#dc2626',
              background: '#fee2e2',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '9999px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="page-container" style={{ maxWidth: selectedChapter ? '1360px' : '960px', flex: 1, padding: '36px 24px', transition: 'max-width 0.25s ease' }}>
        {/* Top Control Bar: "New Novel" Button + Search Bar */}
        <div className="admin-control-bar">
          {/* Action Button: "New Novel" */}
          <button
            onClick={() => setIsCreateNovelOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#17382d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 22px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(23, 56, 45, 0.2)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Plus size={17} strokeWidth={2.5} />
            New Novel
          </button>

          {/* Search bar matching main design */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '9999px',
              padding: '10px 20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
            }}
          >
            <Search size={18} color="#94a3b8" style={{ marginRight: '10px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search novels, folders, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#1e293b',
                fontWeight: 500
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  marginLeft: '8px'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Workspace: Left Folder Tree | Right Content/Reader View */}
        <div className={`admin-workspace-grid ${selectedChapter ? 'with-preview' : ''}`}>
          {/* Left Column: All Novels as Folders */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '16px'
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Novels
                </h2>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '4px 10px',
                  borderRadius: '9999px'
                }}
              >
                {filteredNovels.length} Novels
              </span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <Loader2 size={28} className="animate-spin" color="#17382d" />
              </div>
            ) : filteredNovels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                <Folder size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                <p style={{ fontWeight: 600 }}>No novels found.</p>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Click "+ New Novel" to create your first folder.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredNovels.map((novel) => {
                  const isNovelOpen = !!expandedFolders[novel.id];
                  const detailed = novelDetails[novel.id];

                  return (
                    <div
                      key={novel.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#ffffff',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Novel Level Row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: isNovelOpen ? '#f9fafb' : '#ffffff',
                          cursor: 'pointer',
                          userSelect: 'none',
                          borderBottom: isNovelOpen ? '1px solid #e5e7eb' : 'none'
                        }}
                        onClick={() => toggleNovelFolder(novel.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{ color: '#9ca3af', display: 'flex', flexShrink: 0 }}>
                            {isNovelOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                          <span style={{ color: '#17382d', display: 'flex', flexShrink: 0 }}>
                            {isNovelOpen ? (
                              <FolderOpen size={18} />
                            ) : (
                              <Folder size={18} />
                            )}
                          </span>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {novel.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              By {novel.author} • {detailed ? detailed.volumeList.length : novel.volumes} Vols • {novel.totalChapters} Chs
                            </div>
                          </div>
                        </div>

                        {/* Novel Actions */}
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px', flexShrink: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            title="Add Volume"
                            onClick={() => {
                              setIsCreateVolumeOpen(novel.id);
                              setNewVolumeTitle(`Volume ${(detailed?.volumeList.length || novel.volumes || 0) + 1}`);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#eaf5ee',
                              color: '#1b663e',
                              border: '1px solid #d1fae5',
                              borderRadius: '9999px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            Add Volume
                          </button>

                          <Link
                            href={`/novel/${novel.id}`}
                            target="_blank"
                            title="View public reader"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              color: '#6b7280',
                              background: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Eye size={14} />
                          </Link>

                          <button
                            title="Delete Novel"
                            onClick={() => handleDeleteNovel(novel.id, novel.title)}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              color: '#dc2626',
                              background: '#fef2f2',
                              border: '1px solid #fee2e2',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Novel Children (Volumes) */}
                      {isNovelOpen && (
                        <div style={{ padding: '12px 14px 14px 34px', background: '#fafbfc' }}>
                          {!detailed ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0', fontSize: '13px', color: '#64748b' }}>
                              <Loader2 size={16} className="animate-spin" />
                              Loading volumes from Supabase...
                            </div>
                          ) : detailed.volumeList.length === 0 ? (
                            <div style={{ padding: '14px', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                                No volumes created in this novel folder yet.
                              </p>
                              <button
                                onClick={() => setIsCreateVolumeOpen(novel.id)}
                                style={{
                                  background: '#17382d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                + Create First Volume
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {detailed.volumeList.map((vol) => {
                                const isVolOpen = !!expandedFolders[vol.id];

                                return (
                                  <div
                                    key={vol.id}
                                    style={{
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '10px',
                                      background: '#ffffff',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    {/* Volume Level Row */}
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        background: isVolOpen ? '#f1f5f9' : '#ffffff',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                      }}
                                      onClick={() => toggleVolumeFolder(vol.id)}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#64748b', display: 'flex' }}>
                                          {isVolOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                        </span>
                                        <Layers size={17} color="#2563eb" />
                                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                                          Vol. {vol.volumeNumber}: {vol.title}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: '11px',
                                            color: '#64748b',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            padding: '1px 6px',
                                            borderRadius: '9999px'
                                          }}
                                        >
                                          {vol.chapters.length} Chs
                                        </span>
                                      </div>

                                      {/* Volume Actions */}
                                      <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          title="Add Chapter to this Volume"
                                          onClick={() => {
                                            setIsCreateChapterOpen({
                                              novelId: novel.id,
                                              volumeId: vol.id
                                            });
                                            setNewChapterTitle(`Chapter ${vol.chapters.length + 1}: `);
                                          }}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: '#eff6ff',
                                            color: '#1d4ed8',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <Plus size={12} />
                                          Add Chapter
                                        </button>

                                        <button
                                          title="Delete Volume"
                                          onClick={() => handleDeleteVolume(vol.id, vol.title, novel.id)}
                                          style={{
                                            padding: '4px 6px',
                                            borderRadius: '6px',
                                            color: '#ef4444',
                                            background: '#fee2e2',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex'
                                          }}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Chapters List inside Volume */}
                                    {isVolOpen && (
                                      <div style={{ padding: '8px 10px 10px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                                        {vol.chapters.length === 0 ? (
                                          <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                                            No chapters yet. Click "+ Add Chapter".
                                          </div>
                                        ) : (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {vol.chapters.map((ch) => {
                                              const isSelected = selectedChapter?.chapter.id === ch.id;

                                              return (
                                                <div
                                                  key={ch.id}
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    background: isSelected ? '#eaf5ee' : '#ffffff',
                                                    border: isSelected ? '1.5px solid #17382d' : '1px solid #e2e8f0',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease'
                                                  }}
                                                  onClick={() =>
                                                    setSelectedChapter({
                                                      novelId: novel.id,
                                                      volumeId: vol.id,
                                                      chapter: ch
                                                    })
                                                  }
                                                >
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FileText size={15} color={isSelected ? '#17382d' : '#64748b'} />
                                                    <span
                                                      style={{
                                                        fontFamily: 'JetBrains Mono, monospace',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        background: '#f1f5f9',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        color: '#334155'
                                                      }}
                                                    >
                                                      Ch. {ch.number}
                                                    </span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                                      {ch.title}
                                                    </span>
                                                  </div>

                                                  <div
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                      {ch.wordCount}
                                                    </span>
                                                    <button
                                                      title="Delete Chapter"
                                                      onClick={() => handleDeleteChapter(ch.id, ch.title, vol.id, novel.id)}
                                                      style={{
                                                        padding: '3px 5px',
                                                        borderRadius: '4px',
                                                        color: '#ef4444',
                                                        background: '#fee2e2',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex'
                                                      }}
                                                    >
                                                      <Trash2 size={12} />
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Live Chapter Content Editor / Preview */}
          {selectedChapter && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '28px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="admin-preview-header">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: '#eaf5ee',
                        color: '#17382d',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      Chapter {selectedChapter.chapter.number}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {selectedChapter.chapter.wordCount} • Released {selectedChapter.chapter.releaseDate}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', wordBreak: 'break-word', lineHeight: 1.3 }}>
                    {selectedChapter.chapter.title}
                  </h3>
                </div>

                <div className="admin-preview-actions">
                  <Link
                    href={`/novel/${selectedChapter.novelId}`}
                    target="_blank"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#17382d',
                      color: 'white',
                      padding: '8px 14px',
                      borderRadius: '9999px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <BookOpen size={13} />
                    Open in Reader
                  </Link>

                  <button
                    onClick={() => setSelectedChapter(null)}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Close Preview
                  </button>
                </div>
              </div>

              {/* Chapter Content Preview */}
              <div
                style={{
                  flex: 1,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '24px',
                  overflowY: 'auto',
                  maxHeight: '600px',
                  fontFamily: 'Georgia, serif',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedChapter.chapter.content ||
                  'Content loaded directly from Supabase database. You can read the full text seamlessly in the reader.'}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* Modal: Create Novel (Only requires Title & simple details)     */}
      {/* ------------------------------------------------------------- */}
      {isCreateNovelOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateNovelOpen(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>
                Create New Novel
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Enter the novel title and basic info. Once created, you can add volumes inside it.
              </p>
            </div>

            <form onSubmit={handleCreateNovel} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Novel Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shadow Slave, Reverend Insanity..."
                  value={newNovelTitle}
                  onChange={(e) => setNewNovelTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Category / Genre
                </label>
                <select
                  value={newNovelCategory}
                  onChange={(e) => setNewNovelCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="Mystery & Supernatural">Mystery & Supernatural</option>
                  <option value="Apocalyptic & System">Apocalyptic & System</option>
                  <option value="Progression & Dark Fantasy">Progression & Dark Fantasy</option>
                  <option value="Eastern Cultivation">Eastern Cultivation</option>
                  <option value="Isekai & Progression">Isekai & Progression</option>
                  <option value="Sci-Fi & Cyberpunk">Sci-Fi & Cyberpunk</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Author
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Guiltythree"
                    value={newNovelAuthor}
                    onChange={(e) => setNewNovelAuthor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Aspect / Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dark Fantasy / Progression"
                    value={newNovelAspect}
                    onChange={(e) => setNewNovelAspect(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="Leave empty for 'No Image' placeholder, or paste image URL"
                  value={newNovelCover}
                  onChange={(e) => setNewNovelCover(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Synopsis / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Short synopsis of the novel..."
                  value={newNovelDesc}
                  onChange={(e) => setNewNovelDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateNovelOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#17382d',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Saving...' : 'Create Novel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Create Volume (Only requires Volume Title & description)*/}
      {/* ------------------------------------------------------------- */}
      {isCreateVolumeOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateVolumeOpen(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>
                Create Volume
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Only the title and volume details are required.
              </p>
            </div>

            <form onSubmit={handleCreateVolume} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Volume Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clown, Faceless, The Traveler..."
                  value={newVolumeTitle}
                  onChange={(e) => setNewVolumeTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Volume Description / Arc notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Covers the initial awakening arc."
                  value={newVolumeDesc}
                  onChange={(e) => setNewVolumeDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateVolumeOpen(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#17382d',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Saving...' : 'Create Volume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Create Chapter (Requires Title & Chapter Content text) */}
      {/* ------------------------------------------------------------- */}
      {isCreateChapterOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateChapterOpen(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '720px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>
                Write New Chapter
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Chapters store their full reading text directly in the database.
              </p>
            </div>

            <form onSubmit={handleCreateChapter} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Chapter Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 21: Crimson Shadows"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                    Chapter Content *
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {newChapterContent.trim() ? newChapterContent.trim().split(/\s+/).length : 0} words
                  </span>
                </div>
                <textarea
                  rows={12}
                  required
                  placeholder="Paste or write the chapter story text here..."
                  value={newChapterContent}
                  onChange={(e) => setNewChapterContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '15px',
                    fontFamily: 'Georgia, serif',
                    lineHeight: '1.7',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateChapterOpen(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#17382d',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Publishing...' : 'Publish Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
