
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hashtagsTable } from '../db/schema';
import { getTrendingHashtags } from '../handlers/get_trending_hashtags';

describe('getTrendingHashtags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return hashtags ordered by trending score', async () => {
    // Create test hashtags with different trending scores
    await db.insert(hashtagsTable).values([
      {
        id: 'hashtag1',
        name: 'javascript',
        post_count: 100,
        trending_score: 85.5
      },
      {
        id: 'hashtag2',
        name: 'python',
        post_count: 80,
        trending_score: 92.3
      },
      {
        id: 'hashtag3',
        name: 'react',
        post_count: 60,
        trending_score: 78.1
      }
    ]);

    const result = await getTrendingHashtags();

    expect(result).toHaveLength(3);
    
    // Should be ordered by trending_score descending
    expect(result[0].name).toEqual('python');
    expect(result[0].trending_score).toEqual(92.3);
    expect(typeof result[0].trending_score).toBe('number');
    
    expect(result[1].name).toEqual('javascript');
    expect(result[1].trending_score).toEqual(85.5);
    
    expect(result[2].name).toEqual('react');
    expect(result[2].trending_score).toEqual(78.1);

    // Verify all required fields are present
    result.forEach(hashtag => {
      expect(hashtag.id).toBeDefined();
      expect(hashtag.name).toBeDefined();
      expect(hashtag.post_count).toBeDefined();
      expect(hashtag.trending_score).toBeDefined();
      expect(hashtag.created_at).toBeInstanceOf(Date);
      expect(hashtag.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should respect the limit parameter', async () => {
    // Create 5 hashtags
    await db.insert(hashtagsTable).values([
      { id: 'h1', name: 'tag1', post_count: 10, trending_score: 10.0 },
      { id: 'h2', name: 'tag2', post_count: 20, trending_score: 20.0 },
      { id: 'h3', name: 'tag3', post_count: 30, trending_score: 30.0 },
      { id: 'h4', name: 'tag4', post_count: 40, trending_score: 40.0 },
      { id: 'h5', name: 'tag5', post_count: 50, trending_score: 50.0 }
    ]);

    const result = await getTrendingHashtags(3);

    expect(result).toHaveLength(3);
    
    // Should return top 3 by trending score
    expect(result[0].name).toEqual('tag5');
    expect(result[1].name).toEqual('tag4');
    expect(result[2].name).toEqual('tag3');
  });

  it('should use default limit of 10', async () => {
    // Create 15 hashtags
    const hashtags = Array.from({ length: 15 }, (_, i) => ({
      id: `hashtag${i}`,
      name: `tag${i}`,
      post_count: i,
      trending_score: i * 10.0
    }));

    await db.insert(hashtagsTable).values(hashtags);

    const result = await getTrendingHashtags();

    expect(result).toHaveLength(10);
    
    // Should be ordered by trending score descending
    expect(result[0].trending_score).toEqual(140.0);
    expect(result[9].trending_score).toEqual(50.0);
  });

  it('should return empty array when no hashtags exist', async () => {
    const result = await getTrendingHashtags();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle hashtags with zero trending score', async () => {
    await db.insert(hashtagsTable).values([
      {
        id: 'hashtag1',
        name: 'newtag',
        post_count: 0,
        trending_score: 0.0
      },
      {
        id: 'hashtag2',
        name: 'populartag',
        post_count: 100,
        trending_score: 95.5
      }
    ]);

    const result = await getTrendingHashtags();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('populartag');
    expect(result[1].name).toEqual('newtag');
    expect(result[1].trending_score).toEqual(0.0);
  });
});
