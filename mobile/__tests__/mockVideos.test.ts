// Tests for the mock video data utilities used by Home, Search and Watch.

import {
  CATEGORIES,
  filterByCategory,
  findVideoById,
  MOCK_VIDEOS,
  recommendationsFor,
  searchVideos,
} from '../src/data/mockVideos';

describe('mockVideos', () => {
  test('All categories are well-formed strings', () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    expect(CATEGORIES[0]).toBe('All');
  });

  test('filterByCategory("All") returns everything', () => {
    expect(filterByCategory('All')).toHaveLength(MOCK_VIDEOS.length);
  });

  test('filterByCategory filters by exact category', () => {
    const tech = filterByCategory('Tech');
    expect(tech.length).toBeGreaterThan(0);
    expect(tech.every(v => v.category === 'Tech')).toBe(true);
  });

  test('searchVideos matches title, channel, or category (case-insensitive)', () => {
    expect(searchVideos('REACT').length).toBeGreaterThan(0);
    expect(searchVideos('focus sounds').length).toBeGreaterThan(0);
    expect(searchVideos('music').length).toBeGreaterThan(0);
  });

  test('searchVideos returns [] for empty query', () => {
    expect(searchVideos('   ')).toEqual([]);
  });

  test('recommendationsFor excludes the current video', () => {
    const id = MOCK_VIDEOS[0]!.videoId;
    const recs = recommendationsFor(id);
    expect(recs).toHaveLength(MOCK_VIDEOS.length - 1);
    expect(recs.every(v => v.videoId !== id)).toBe(true);
  });

  test('findVideoById returns the matching video or undefined', () => {
    expect(findVideoById(MOCK_VIDEOS[0]!.videoId)).toBeDefined();
    expect(findVideoById('does-not-exist')).toBeUndefined();
  });
});
