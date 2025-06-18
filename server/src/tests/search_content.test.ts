
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, hashtagsTable } from '../db/schema';
import { type SearchInput } from '../schema';
import { searchContent } from '../handlers/search_content';

// Test data
const testUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  follower_count: 100
};

const testUser2 = {
  id: 'user-2',
  email: 'another@example.com',
  username: 'developer',
  display_name: 'Another Developer',
  follower_count: 50
};

const testPost = {
  id: 'post-1',
  user_id: 'user-1',
  content: 'This is a test post about JavaScript'
};

const testPost2 = {
  id: 'post-2',
  user_id: 'user-2',
  content: 'Learning React and TypeScript today'
};

const testHashtag = {
  id: 'hashtag-1',
  name: 'javascript',
  trending_score: 95.5
};

const testHashtag2 = {
  id: 'hashtag-2',
  name: 'typescript',
  trending_score: 87.2
};

describe('searchContent', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test users
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    
    // Create test posts
    await db.insert(postsTable).values([testPost, testPost2]).execute();
    
    // Create test hashtags - convert trending_score to number for insertion
    await db.insert(hashtagsTable).values([
      { ...testHashtag, trending_score: testHashtag.trending_score },
      { ...testHashtag2, trending_score: testHashtag2.trending_score }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should search posts by content', async () => {
    const input: SearchInput = {
      query: 'javascript',
      type: 'posts',
      limit: 10,
      offset: 0
    };

    const result = await searchContent(input);

    expect(result.posts).toBeDefined();
    expect(result.posts).toHaveLength(1);
    expect(result.posts![0].content).toContain('JavaScript');
    expect(result.posts![0].id).toEqual('post-1');
    expect(result.users).toBeUndefined();
    expect(result.hashtags).toBeUndefined();
  });

  it('should search users by username', async () => {
    const input: SearchInput = {
      query: 'test',
      type: 'users',
      limit: 10,
      offset: 0
    };

    const result = await searchContent(input);

    expect(result.users).toBeDefined();
    expect(result.users).toHaveLength(1);
    expect(result.users![0].username).toEqual('testuser');
    expect(result.users![0].id).toEqual('user-1');
    expect(result.posts).toBeUndefined();
    expect(result.hashtags).toBeUndefined();
  });

  it('should search hashtags by name', async () => {
    const input: SearchInput = {
      query: 'script',
      type: 'hashtags',
      limit: 10,
      offset: 0
    };

    const result = await searchContent(input);

    expect(result.hashtags).toBeDefined();
    expect(result.hashtags).toHaveLength(2);
    expect(result.hashtags![0].name).toEqual('javascript'); // Higher trending score first
    expect(result.hashtags![1].name).toEqual('typescript');
    expect(typeof result.hashtags![0].trending_score).toBe('number');
    expect(result.hashtags![0].trending_score).toEqual(95.5);
    expect(result.posts).toBeUndefined();
    expect(result.users).toBeUndefined();
  });

  it('should search all content types when no type specified', async () => {
    const input: SearchInput = {
      query: 'test',
      limit: 10,
      offset: 0
    };

    const result = await searchContent(input);

    expect(result.posts).toBeDefined();
    expect(result.users).toBeDefined();
    expect(result.hashtags).toBeDefined();
    expect(result.posts).toHaveLength(1);
    expect(result.users).toHaveLength(1);
    expect(result.hashtags).toHaveLength(0); // No hashtags contain 'test'
  });

  it('should apply limit and offset correctly', async () => {
    const input: SearchInput = {
      query: 'e', // Should match both users (testuser and developer)
      type: 'users',
      limit: 1,
      offset: 1
    };

    const result = await searchContent(input);

    expect(result.users).toBeDefined();
    expect(result.users).toHaveLength(1);
    // Should get the second user (after offset) - developer has lower follower_count
    expect(result.users![0].username).toEqual('developer');
    expect(result.users![0].follower_count).toEqual(50);
  });

  it('should return empty results for non-matching query', async () => {
    const input: SearchInput = {
      query: 'nonexistent',
      limit: 10,
      offset: 0
    };

    const result = await searchContent(input);

    expect(result.posts).toBeDefined();
    expect(result.users).toBeDefined();
    expect(result.hashtags).toBeDefined();
    expect(result.posts).toHaveLength(0);
    expect(result.users).toHaveLength(0);
    expect(result.hashtags).toHaveLength(0);
  });

  it('should handle case-insensitive search', async () => {
    const input: SearchInput = {
      query: 'JAVASCRIPT',
      type: 'posts',
      limit: 10,
      offset: 0
    };

    const result = await searchContent(input);

    expect(result.posts).toBeDefined();
    expect(result.posts).toHaveLength(1);
    expect(result.posts![0].content).toContain('JavaScript');
  });

  it('should order users by follower count descending', async () => {
    const input: SearchInput = {
      query: 'e', // Should match both users
      type: 'users',
      limit: 10,
      offset: 0
    };

    const result = await searchContent(input);

    expect(result.users).toBeDefined();
    expect(result.users).toHaveLength(2);
    // First user should have higher follower count
    expect(result.users![0].username).toEqual('testuser');
    expect(result.users![0].follower_count).toEqual(100);
    expect(result.users![1].username).toEqual('developer');
    expect(result.users![1].follower_count).toEqual(50);
  });
});
