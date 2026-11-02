import { supabase } from '@/lib/supabase';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  releaseDate: string;
  wordCount: string;
  content?: string;
}

export interface Volume {
  id: string;
  volumeNumber: number;
  title: string;
  description: string;
  chapterCount: number;
  chapters: Chapter[];
}

export interface Novel {
  id: string;
  badge?: string;
  category: string;
  title: string;
  author: string;
  coverImage: string;
  rating: number;
  reviewCount: string;
  volumes: number;
  totalChapters: number;
  formatBadge: string;
  aspectSubtitle: string;
  status: 'Ongoing' | 'Completed';
  tags: string[];
  description: string;
  editions: { name: string; price: string }[];
  volumeList: Volume[];
}

/**
 * Fetch all novels directly from the Supabase database.
 */
export async function getNovelsFromDB(): Promise<Novel[]> {
  const { data: novels, error: novelErr } = await supabase
    .from('novels')
    .select('*')
    .order('id', { ascending: true });

  if (novelErr || !novels) {
    console.error('Failed to query novels from database', novelErr);
    return [];
  }

  return novels.map((n) => ({
    id: n.id,
    badge: n.badge,
    category: n.category,
    title: n.title,
    author: n.author,
    coverImage: n.cover_image,
    rating: Number(n.rating),
    reviewCount: n.review_count,
    volumes: n.volumes,
    totalChapters: n.total_chapters,
    formatBadge: n.format_badge,
    aspectSubtitle: n.aspect_subtitle,
    status: n.status,
    tags: n.tags || [],
    description: n.description,
    editions: n.editions || [],
    volumeList: []
  }));
}

/**
 * Fetch a single novel with all its Volumes and Chapters directly from the Supabase database.
 */
export async function getNovelWithVolumesAndChapters(novelId: string): Promise<Novel | null> {
  const { data: novel, error: novelErr } = await supabase
    .from('novels')
    .select('*')
    .eq('id', novelId)
    .single();

  if (novelErr || !novel) {
    console.error(`Novel ${novelId} not found in database`, novelErr);
    return null;
  }

  // Retrieve all volumes for this novel
  const { data: volumes, error: volErr } = await supabase
    .from('volumes')
    .select('*')
    .eq('novel_id', novelId)
    .order('volume_number', { ascending: true });

  if (volErr || !volumes) {
    console.error(`Volumes for novel ${novelId} not found in database`, volErr);
    return null;
  }

  // Retrieve all chapters for this novel
  const { data: chapters, error: chErr } = await supabase
    .from('chapters')
    .select('id, novel_id, volume_id, chapter_number, title, release_date, word_count')
    .eq('novel_id', novelId)
    .order('chapter_number', { ascending: true });

  if (chErr) {
    console.error(`Chapters for novel ${novelId} not found in database`, chErr);
  }

  const volumeList: Volume[] = volumes.map((v) => {
    const volChapters: Chapter[] = (chapters || [])
      .filter((c) => c.volume_id === v.id)
      .map((c) => ({
        id: c.id,
        number: c.chapter_number,
        title: c.title,
        releaseDate: c.release_date,
        wordCount: c.word_count
      }));

    return {
      id: v.id,
      volumeNumber: v.volume_number,
      title: v.title,
      description: v.description,
      chapterCount: v.chapter_count || volChapters.length,
      chapters: volChapters
    };
  });

  return {
    id: novel.id,
    badge: novel.badge,
    category: novel.category,
    title: novel.title,
    author: novel.author,
    coverImage: novel.cover_image,
    rating: Number(novel.rating),
    reviewCount: novel.review_count,
    volumes: novel.volumes,
    totalChapters: novel.total_chapters,
    formatBadge: novel.format_badge,
    aspectSubtitle: novel.aspect_subtitle,
    status: novel.status,
    tags: novel.tags || [],
    description: novel.description,
    editions: novel.editions || [],
    volumeList
  };
}

/**
 * Fetch the full text content of a specific chapter directly from the Supabase database.
 * If volumeId is provided, matches chapter within that specific volume; otherwise by chapter id or novel+chapter number.
 */
export async function getChapterContentFromDB(
  novelId: string,
  chapterIdentifier: { chapterId?: string; volumeId?: string; chapterNumber: number }
): Promise<{
  id: string;
  volumeId: string;
  title: string;
  chapterNumber: number;
  releaseDate: string;
  wordCount: string;
  content: string;
} | null> {
  let query = supabase.from('chapters').select('*');

  if (chapterIdentifier.chapterId) {
    query = query.eq('id', chapterIdentifier.chapterId);
  } else if (chapterIdentifier.volumeId) {
    query = query
      .eq('volume_id', chapterIdentifier.volumeId)
      .eq('chapter_number', chapterIdentifier.chapterNumber);
  } else {
    query = query
      .eq('novel_id', novelId)
      .eq('chapter_number', chapterIdentifier.chapterNumber);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error || !data) {
    console.error(`Chapter of novel ${novelId} not found in database`, error);
    return null;
  }

  return {
    id: data.id,
    volumeId: data.volume_id,
    title: data.title,
    chapterNumber: data.chapter_number,
    releaseDate: data.release_date,
    wordCount: data.word_count,
    content: data.content
  };
}

/**
 * Admin: Create a new novel in Supabase
 */
export async function createNovelInDB(novel: {
  id?: string;
  title: string;
  category: string;
  author: string;
  aspectSubtitle?: string;
  description?: string;
  coverImage?: string;
  badge?: string;
  formatBadge?: string;
  status?: 'Ongoing' | 'Completed';
  tags?: string[];
}): Promise<Novel | null> {
  const novelId = novel.id || 'novel-' + Date.now();
  const payload = {
    id: novelId,
    title: novel.title,
    category: novel.category || 'General',
    author: novel.author || 'Anonymous',
    aspect_subtitle: novel.aspectSubtitle || 'Fantasy / Adventure',
    description: novel.description || '',
    cover_image: novel.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000',
    badge: novel.badge || 'New',
    format_badge: novel.formatBadge || 'WEB NOVEL',
    status: novel.status || 'Ongoing',
    tags: novel.tags || ['Novel'],
    volumes: 0,
    total_chapters: 0,
    rating: 5.0,
    review_count: '1'
  };

  const { data, error } = await supabase.from('novels').insert([payload]).select().single();
  if (error || !data) {
    console.error('Failed to create novel:', error);
    return null;
  }

  return {
    id: data.id,
    badge: data.badge,
    category: data.category,
    title: data.title,
    author: data.author,
    coverImage: data.cover_image,
    rating: Number(data.rating),
    reviewCount: data.review_count,
    volumes: data.volumes,
    totalChapters: data.total_chapters,
    formatBadge: data.format_badge,
    aspectSubtitle: data.aspect_subtitle,
    status: data.status,
    tags: data.tags || [],
    description: data.description,
    editions: data.editions || [],
    volumeList: []
  };
}

/**
 * Admin: Create a new volume in Supabase
 */
export async function createVolumeInDB(vol: {
  novelId: string;
  title: string;
  description?: string;
  volumeNumber?: number;
}): Promise<Volume | null> {
  // If volumeNumber not passed, calculate next
  let volNum = vol.volumeNumber;
  if (!volNum) {
    const { count } = await supabase
      .from('volumes')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', vol.novelId);
    volNum = (count || 0) + 1;
  }

  const volumeId = `${vol.novelId}-vol-${volNum}`;
  const payload = {
    id: volumeId,
    novel_id: vol.novelId,
    volume_number: volNum,
    title: vol.title,
    description: vol.description || `Volume ${volNum}`,
    chapter_count: 0
  };

  const { data, error } = await supabase.from('volumes').insert([payload]).select().single();
  if (error || !data) {
    console.error('Failed to create volume:', error);
    return null;
  }

  // Update novel's volume count
  const { count: totalVols } = await supabase
    .from('volumes')
    .select('*', { count: 'exact', head: true })
    .eq('novel_id', vol.novelId);
  await supabase
    .from('novels')
    .update({ volumes: totalVols || volNum })
    .eq('id', vol.novelId);

  return {
    id: data.id,
    volumeNumber: data.volume_number,
    title: data.title,
    description: data.description,
    chapterCount: 0,
    chapters: []
  };
}

/**
 * Admin: Create a new chapter in Supabase (chapters restart from 1 per volume)
 */
export async function createChapterInDB(ch: {
  novelId: string;
  volumeId: string;
  title: string;
  content: string;
  chapterNumber?: number;
}): Promise<Chapter | null> {
  // Determine chapter number per volume if not provided
  let chNum = ch.chapterNumber;
  if (!chNum) {
    const { data: latestCh } = await supabase
      .from('chapters')
      .select('chapter_number')
      .eq('volume_id', ch.volumeId)
      .order('chapter_number', { ascending: false })
      .limit(1);
    chNum = latestCh && latestCh.length > 0 ? latestCh[0].chapter_number + 1 : 1;
  }

  const wordCount = `${ch.content ? ch.content.trim().split(/\s+/).length : 0} words`;
  const chId = `${ch.volumeId}-ch-${chNum}`;
  const payload = {
    id: chId,
    novel_id: ch.novelId,
    volume_id: ch.volumeId,
    chapter_number: chNum,
    title: ch.title,
    content: ch.content,
    release_date: 'Just now',
    word_count: wordCount
  };

  const { data, error } = await supabase.from('chapters').insert([payload]).select().single();
  if (error || !data) {
    console.error('Failed to create chapter:', error);
    return null;
  }

  // Update volume's chapter_count
  const { count: volChCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })
    .eq('volume_id', ch.volumeId);
  await supabase
    .from('volumes')
    .update({ chapter_count: volChCount || 1 })
    .eq('id', ch.volumeId);

  // Update novel's total_chapters
  const { count: novelChCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })
    .eq('novel_id', ch.novelId);
  await supabase
    .from('novels')
    .update({ total_chapters: novelChCount || chNum })
    .eq('id', ch.novelId);

  return {
    id: data.id,
    number: data.chapter_number,
    title: data.title,
    releaseDate: data.release_date,
    wordCount: data.word_count,
    content: data.content
  };
}

/**
 * Admin: Delete a novel and cascade delete its volumes and chapters
 */
export async function deleteNovelFromDB(novelId: string): Promise<boolean> {
  await supabase.from('chapters').delete().eq('novel_id', novelId);
  await supabase.from('volumes').delete().eq('novel_id', novelId);
  const { error } = await supabase.from('novels').delete().eq('id', novelId);
  return !error;
}

/**
 * Admin: Delete a volume and its chapters
 */
export async function deleteVolumeFromDB(volumeId: string, novelId: string): Promise<boolean> {
  await supabase.from('chapters').delete().eq('volume_id', volumeId);
  const { error } = await supabase.from('volumes').delete().eq('id', volumeId);
  if (!error) {
    // Recalculate novel totals
    const { count: totalVols } = await supabase
      .from('volumes')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId);
    const { count: totalChs } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId);
    await supabase
      .from('novels')
      .update({ volumes: totalVols || 0, total_chapters: totalChs || 0 })
      .eq('id', novelId);
    return true;
  }
  return false;
}

/**
 * Admin: Delete a chapter
 */
export async function deleteChapterFromDB(chapterId: string, volumeId: string, novelId: string): Promise<boolean> {
  const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
  if (!error) {
    const { count: volChCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('volume_id', volumeId);
    await supabase.from('volumes').update({ chapter_count: volChCount || 0 }).eq('id', volumeId);

    const { count: totalChs } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId);
    await supabase.from('novels').update({ total_chapters: totalChs || 0 }).eq('id', novelId);
    return true;
  }
  return false;
}
