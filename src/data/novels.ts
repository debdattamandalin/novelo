export interface Chapter {
  id: string;
  number: number;
  title: string;
  releaseDate: string;
  wordCount: string;
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

function generateContinuousVolumes(volumeCount: number, chaptersPerVolume: number = 20): Volume[] {
  const volumes: Volume[] = [];

  const volumeTitles = [
    'Clown',
    'Faceless',
    'Traveler',
    'Undying',
    'Red Priest',
    'Lightseeker',
    'The Hanged Man',
    'Fool',
    'Cataclysm',
    'Return of the King',
    'Demon Hunter',
    'Awakening'
  ];

  let currentChapterNum = 1;

  for (let v = 1; v <= volumeCount; v++) {
    const chapters: Chapter[] = [];

    for (let c = 1; c <= chaptersPerVolume; c++) {
      const chNum = currentChapterNum;
      chapters.push({
        id: `v${v}-ch${chNum}`,
        number: chNum,
        title: `Chapter ${chNum}: The Unveiling of Fate - Part ${c}`,
        releaseDate: `${Math.max(1, 12 - v)} months ago`,
        wordCount: `${(2400 + ((chNum * 37) % 800)).toLocaleString()} words`
      });
      currentChapterNum++;
    }

    const startCh = (v - 1) * chaptersPerVolume + 1;
    const endCh = v * chaptersPerVolume;

    volumes.push({
      id: `vol-${v}`,
      volumeNumber: v,
      title: volumeTitles[(v - 1) % volumeTitles.length] || `Chronicles of Arc ${v}`,
      description: `Covers Chapters ${startCh} through ${endCh}. The journey deepens as unexpected adversaries emerge.`,
      chapterCount: chaptersPerVolume,
      chapters
    });
  }

  return volumes;
}

export const SAMPLE_NOVELS: Novel[] = [
  {
    id: '1',
    badge: 'Bestseller',
    category: 'MYSTERY & SUPERNATURAL',
    title: 'Lord of the Mysteries',
    author: 'Cuttlefish That Loves Diving',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: '48.5K',
    volumes: 8,
    totalChapters: 160,
    formatBadge: '8 Vols / 160 Chs',
    aspectSubtitle: 'Aspect: Steampunk / Mystery / Lovecraftian',
    status: 'Completed',
    tags: ['Steampunk', 'Mystery', 'Lovecraftian', 'Transmigration'],
    description: 'With the rising tide of steam power and machinery, who can come close to being a Beyonder? Klein Moretti awakens into an alternate Victorian world filled with deities, potions, and cosmic secrets.',
    editions: [
      { name: 'Digital Web', price: 'Free' },
      { name: 'Hardcover Vol 1-3', price: '₹899' },
      { name: 'Collector Slipcase', price: '₹2,499' }
    ],
    volumeList: generateContinuousVolumes(8, 20)
  },
  {
    id: '2',
    badge: 'Fast Turnaround',
    category: 'APOCALYPTIC & SYSTEM',
    title: 'Omniscient Reader’s Viewpoint',
    author: 'Sing-Shong',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: '62.1K',
    volumes: 5,
    totalChapters: 100,
    formatBadge: '5 Vols / 100 Chs',
    aspectSubtitle: 'Aspect: Survival / Constellation / Psychological',
    status: 'Completed',
    tags: ['Apocalypse', 'Survival', 'Constellations', 'Psychological'],
    description: 'Dokja was an ordinary office worker whose only hobby was reading a niche web novel. When the novel suddenly becomes brutal reality, he is the only reader who knows the story\'s ending.',
    editions: [
      { name: 'E-Book Full Boxset', price: '₹499' },
      { name: 'Paperback Edition', price: '₹649' },
      { name: 'Artbook Bundle', price: '₹1,299' }
    ],
    volumeList: generateContinuousVolumes(5, 20)
  },
  {
    id: '3',
    badge: 'Popular',
    category: 'PROGRESSION & DARK FANTASY',
    title: 'Shadow Slave',
    author: 'Guiltythree',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: '35.9K',
    volumes: 7,
    totalChapters: 140,
    formatBadge: '7 Vols / 140 Chs',
    aspectSubtitle: 'Aspect: Dark Fantasy / System / Survival',
    status: 'Ongoing',
    tags: ['Dark Fantasy', 'System', 'Survival', 'Monsters'],
    description: 'Growing up in poverty on the outskirts of humanity, Sunny is chosen by the Nightmare Spell. Transported into a ruined magical world, he must survive among lethal abominations.',
    editions: [
      { name: 'Daily Web Chapters', price: 'Free' },
      { name: 'Early Access Tier', price: '₹349/mo' },
      { name: 'Signed Illustrated', price: '₹1,850' }
    ],
    volumeList: generateContinuousVolumes(7, 20)
  },
  {
    id: '4',
    badge: 'Cult Classic',
    category: 'EASTERN CULTIVATION & XIANXIA',
    title: 'Reverend Insanity',
    author: 'Gu Zhen Ren',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: '29.4K',
    volumes: 6,
    totalChapters: 120,
    formatBadge: '6 Vols / 120 Chs',
    aspectSubtitle: 'Aspect: Cultivation / Scheming / Anti-Hero',
    status: 'Completed',
    tags: ['Cultivation', 'Anti-Hero', 'Scheming', 'Dark'],
    description: 'Fang Yuan reincarnates 500 years back with the Spring Autumn Cicada. Armed with immense foresight and unwavering willpower, he calculates every step towards eternal supremacy.',
    editions: [
      { name: 'Web Complete', price: 'Free' },
      { name: 'Deluxe Leatherbound', price: '₹2,999' }
    ],
    volumeList: generateContinuousVolumes(6, 20)
  },
  {
    id: '5',
    badge: 'Bestseller',
    category: 'ISEKAI & PROGRESSION',
    title: 'The Beginning After the End',
    author: 'TurtleMe',
    coverImage: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewCount: '52.3K',
    volumes: 11,
    totalChapters: 220,
    formatBadge: '11 Vols / 220 Chs',
    aspectSubtitle: 'Aspect: Reincarnation / Magic / Academy',
    status: 'Ongoing',
    tags: ['Reincarnation', 'Magic', 'Academy', 'War'],
    description: 'King Grey possessed unrivaled strength and wealth in a world governed by martial ability. Reincarnated into a fantastical world of magic and mythical beasts, he starts life anew.',
    editions: [
      { name: 'Kindle Edition', price: '₹299' },
      { name: 'Audiobook Bundle', price: '₹799' },
      { name: 'Hardcover Vol 1-5', price: '₹1,599' }
    ],
    volumeList: generateContinuousVolumes(11, 20)
  },
  {
    id: '6',
    badge: 'Popular',
    category: 'HUNTER & SYSTEM APOCALYPSE',
    title: 'Solo Leveling (Only I Level Up)',
    author: 'Chugong',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: '78.0K',
    volumes: 4,
    totalChapters: 80,
    formatBadge: '4 Vols / 80 Chs',
    aspectSubtitle: 'Aspect: Hunter / Dungeons / System',
    status: 'Completed',
    tags: ['Hunter', 'Dungeons', 'System', 'Action'],
    description: 'Known as the "Weakest Hunter of All Mankind", Sung Jin-Woo receives a unique quest system in a hidden double dungeon that allows only him to level up without limits.',
    editions: [
      { name: 'Digital Webtoon/Novel', price: 'Free' },
      { name: 'Full Boxset (Vol 1-4)', price: '₹1,899' },
      { name: 'Special Shadow Edition', price: '₹3,200' }
    ],
    volumeList: generateContinuousVolumes(4, 20)
  }
];
