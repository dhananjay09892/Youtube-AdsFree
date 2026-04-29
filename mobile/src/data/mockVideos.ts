// Mock video data so the app works offline without a YouTube API key.
// Replace with a real data source (YouTube Data API v3) when ready.

import {Video} from '../store/types';

export const CATEGORIES: string[] = [
  'All',
  'Music',
  'Gaming',
  'News',
  'Tech',
  'Education',
  'Sports',
  'Comedy',
];

export const MOCK_VIDEOS: Video[] = [
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Building a clean YouTube experience with React Native',
    channelName: 'Code Cinema',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    viewCount: '1.2M views',
    duration: '12:34',
    publishedAt: '2 days ago',
    category: 'Tech',
    description:
      'In this video we explore how to build a distraction-free YouTube viewer using React Native, Zustand and a clean component architecture.',
  },
  {
    videoId: 'jNQXAC9IVRw',
    title: 'Lo-fi beats to focus / study to (1 hour mix)',
    channelName: 'Focus Sounds',
    thumbnailUrl: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
    viewCount: '850K views',
    duration: '1:02:11',
    publishedAt: '1 week ago',
    category: 'Music',
    description: 'A calm lo-fi mix to help you focus during long work sessions.',
  },
  {
    videoId: '9bZkp7q19f0',
    title: 'Indie game devlog #14 — shipping the demo',
    channelName: 'Pixel Forge',
    thumbnailUrl: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg',
    viewCount: '210K views',
    duration: '18:42',
    publishedAt: '5 days ago',
    category: 'Gaming',
    description: 'Wrapping up the demo build and sharing what worked and what failed.',
  },
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'TypeScript tips every senior dev should know',
    channelName: 'Type Safe',
    thumbnailUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    viewCount: '430K views',
    duration: '22:08',
    publishedAt: '3 days ago',
    category: 'Education',
    description: 'A handful of TypeScript patterns that improve code quality.',
  },
  {
    videoId: 'M7lc1UVf-VE',
    title: 'World news in 10 minutes — daily briefing',
    channelName: 'Daily Wire',
    thumbnailUrl: 'https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg',
    viewCount: '92K views',
    duration: '10:00',
    publishedAt: '6 hours ago',
    category: 'News',
    description: 'Today\u2019s top stories around the world in ten minutes.',
  },
  {
    videoId: 'L_jWHffIx5E',
    title: 'How the new physics engine works under the hood',
    channelName: 'Engine Room',
    thumbnailUrl: 'https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg',
    viewCount: '76K views',
    duration: '15:27',
    publishedAt: '4 days ago',
    category: 'Tech',
    description: 'Breaking down the architecture of a modern game physics engine.',
  },
];

// Filter videos by category (case-insensitive). 'All' returns everything.
export function filterByCategory(category: string): Video[] {
  if (category === 'All') {
    return MOCK_VIDEOS;
  }
  return MOCK_VIDEOS.filter(v => v.category === category);
}

// Search videos by query (matches title, channel, or category).
export function searchVideos(query: string): Video[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return [];
  }
  return MOCK_VIDEOS.filter(v => {
    return (
      v.title.toLowerCase().includes(q) ||
      v.channelName.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    );
  });
}

// Recommended list = all videos except the one currently being watched.
export function recommendationsFor(videoId: string): Video[] {
  return MOCK_VIDEOS.filter(v => v.videoId !== videoId);
}

export function findVideoById(videoId: string): Video | undefined {
  return MOCK_VIDEOS.find(v => v.videoId === videoId);
}
