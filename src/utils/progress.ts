import { supabase } from '@/lib/supabase';

export interface ReadingProgress {
  novelId: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  volumeNumber: number;
  updatedAt: number;
}

const STORAGE_KEY = 'noveltube_reading_progress';

export async function getNovelProgress(novelId: string): Promise<ReadingProgress | null> {
  // 1. Try fetching from Supabase `reading_progress` table
  try {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('novel_id', novelId)
      .eq('user_identifier', 'guest')
      .maybeSingle();

    if (!error && data) {
      return {
        novelId: data.novel_id,
        chapterId: data.chapter_id,
        chapterNumber: data.chapter_number,
        chapterTitle: data.chapter_title,
        volumeNumber: data.volume_number,
        updatedAt: new Date(data.updated_at).getTime()
      };
    }
  } catch (err) {
    console.warn('Supabase reading progress fetch failed, fallback to local', err);
  }

  // 2. Fallback to localStorage
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data[novelId] || null;
  } catch (e) {
    return null;
  }
}

export async function getAllProgress(): Promise<Record<string, ReadingProgress>> {
  const result: Record<string, ReadingProgress> = {};

  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_identifier', 'guest');

    if (!error && data && data.length > 0) {
      data.forEach((row) => {
        result[row.novel_id] = {
          novelId: row.novel_id,
          chapterId: row.chapter_id,
          chapterNumber: row.chapter_number,
          chapterTitle: row.chapter_title,
          volumeNumber: row.volume_number,
          updatedAt: new Date(row.updated_at).getTime()
        };
      });
      return result;
    }
  } catch (err) {
    console.warn('Supabase getAllProgress failed, fallback to local', err);
  }

  // 2. Fallback to localStorage
  if (typeof window === 'undefined') return result;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : result;
  } catch (e) {
    return result;
  }
}

export async function saveNovelProgress(progress: ReadingProgress): Promise<void> {
  // 1. Save to localStorage immediately
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      existing[progress.novelId] = progress;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // 2. Sync to Supabase `reading_progress` table
  try {
    await supabase.from('reading_progress').upsert(
      {
        novel_id: progress.novelId,
        chapter_id: progress.chapterId,
        chapter_number: progress.chapterNumber,
        chapter_title: progress.chapterTitle,
        volume_number: progress.volumeNumber,
        user_identifier: 'guest',
        updated_at: new Date(progress.updatedAt).toISOString()
      },
      { onConflict: 'novel_id,user_identifier' }
    );
  } catch (err) {
    console.warn('Failed to sync progress to Supabase', err);
  }
}
