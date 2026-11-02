import { createClient } from '@supabase/supabase-js';
import { SAMPLE_NOVELS } from '../src/data/novels';

const supabase = createClient(
  'https://embtczgtlpyeoarndnfd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYnRjemd0bHB5ZW9hcm5kbmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MDcyMDksImV4cCI6MjEwOTE4MzIwOX0.IoMVpUzeaRte2RaG4R2_lFa47qF--Pr378Dcg9RrYLc'
);

async function seed() {
  console.log('Seeding bulk data to Supabase...');

  const novelsData = SAMPLE_NOVELS.map((n) => ({
    id: n.id,
    badge: n.badge,
    category: n.category,
    title: n.title,
    author: n.author,
    cover_image: n.coverImage,
    rating: n.rating,
    review_count: n.reviewCount,
    volumes: n.volumes,
    total_chapters: n.totalChapters,
    format_badge: n.formatBadge,
    aspect_subtitle: n.aspectSubtitle,
    status: n.status,
    tags: n.tags,
    description: n.description,
    editions: n.editions
  }));

  const { error: nErr } = await supabase.from('novels').upsert(novelsData);
  if (nErr) console.error('Novels error', nErr);

  const volumesData = [];
  const chaptersData = [];

  for (const novel of SAMPLE_NOVELS) {
    for (const vol of novel.volumeList) {
      volumesData.push({
        id: `${novel.id}-${vol.id}`,
        novel_id: novel.id,
        volume_number: vol.volumeNumber,
        title: vol.title,
        description: vol.description,
        chapter_count: vol.chapterCount
      });

      for (const ch of vol.chapters) {
        chaptersData.push({
          id: `${novel.id}-${ch.id}`,
          novel_id: novel.id,
          volume_id: `${novel.id}-${vol.id}`,
          chapter_number: ch.number,
          title: ch.title,
          release_date: ch.releaseDate,
          word_count: ch.wordCount,
          content: 'The oil lamp flickered as twilight settled over the gaslit streets...'
        });
      }
    }
  }

  // Insert in batches of 100
  for (let i = 0; i < volumesData.length; i += 100) {
    await supabase.from('volumes').upsert(volumesData.slice(i, i + 100));
  }
  for (let i = 0; i < chaptersData.length; i += 100) {
    await supabase.from('chapters').upsert(chaptersData.slice(i, i + 100));
  }

  console.log(`Seeded ${novelsData.length} novels, ${volumesData.length} volumes, ${chaptersData.length} chapters.`);
}

seed();
