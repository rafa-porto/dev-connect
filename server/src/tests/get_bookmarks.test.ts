
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, bookmarksTable } from '../db/schema';
import { getBookmarks } from '../handlers/get_bookmarks';

// Test data
const testUser1 = {
  id: 'user1',
  email: 'user1@example.com',
  username: 'user1',
  display_name: 'User One',
  bio: null,
  avatar_url: null,
  banner_url: null,
  location: null,
  website: null,
  github_url: null,
  portfolio_url: null,
  is_premium: false,
  is_verified: false,
  follower_count: 0,
  following_count: 0,
  post_count: 0
};

const testUser2 = {
  id: 'user2',
  email: 'user2@example.com',
  username: 'user2',
  display_name: 'User Two',
  bio: null,
  avatar_url: null,
  banner_url: null,
  location: null,
  website: null,
  github_url: null,
  portfolio_url: null,
  is_premium: false,
  is_verified: false,
  follower_count: 0,
  following_count: 0,
  post_count: 0
};

const testPost1 = {
  id: 'post1',
  user_id: 'user2',
  content: 'Test post 1',
  code_snippet: null,
  code_language: null,
  image_urls: [],
  link_url: null,
  link_title: null,
  link_description: null,
  parent_post_id: null,
  repost_id: null,
  repost_comment: null,
  like_count: 0,
  reply_count: 0,
  repost_count: 0,
  bookmark_count: 0,
  view_count: 0,
  is_pinned: false
};

const testPost2 = {
  id: 'post2',
  user_id: 'user2',
  content: 'Test post 2',
  code_snippet: null,
  code_language: null,
  image_urls: [],
  link_url: null,
  link_title: null,
  link_description: null,
  parent_post_id: null,
  repost_id: null,
  repost_comment: null,
  like_count: 0,
  reply_count: 0,
  repost_count: 0,
  bookmark_count: 0,
  view_count: 0,
  is_pinned: false
};

describe('getBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return bookmarked posts for a user', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser1, testUser2]).execute();
    await db.insert(postsTable).values([testPost1, testPost2]).execute();
    
    // Create bookmarks with a small delay to ensure different timestamps
    await db.insert(bookmarksTable).values([{
      id: 'bookmark1',
      user_id: 'user1',
      post_id: 'post1'
    }]).execute();
    
    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(bookmarksTable).values([{
      id: 'bookmark2',
      user_id: 'user1',
      post_id: 'post2'
    }]).execute();

    const result = await getBookmarks('user1');

    expect(result).toHaveLength(2);
    // Check that we got both posts, regardless of order
    const postIds = result.map(post => post.id);
    expect(postIds).toContain('post1');
    expect(postIds).toContain('post2');
    
    // Verify the most recent bookmark is first (post2)
    expect(result[0].id).toBe('post2');
    expect(result[0].content).toBe('Test post 2');
    expect(result[0].user_id).toBe('user2');
    expect(result[1].id).toBe('post1');
    expect(result[1].content).toBe('Test post 1');
    expect(result[1].user_id).toBe('user2');
  });

  it('should return empty array when user has no bookmarks', async () => {
    // Create users but no bookmarks
    await db.insert(usersTable).values([testUser1, testUser2]).execute();
    await db.insert(postsTable).values([testPost1]).execute();

    const result = await getBookmarks('user1');

    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser1, testUser2]).execute();
    await db.insert(postsTable).values([testPost1, testPost2]).execute();
    
    // Create bookmarks with delays
    await db.insert(bookmarksTable).values([{
      id: 'bookmark1',
      user_id: 'user1',
      post_id: 'post1'
    }]).execute();
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(bookmarksTable).values([{
      id: 'bookmark2',
      user_id: 'user1',
      post_id: 'post2'
    }]).execute();

    const result = await getBookmarks('user1', 1);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('post2'); // Most recent bookmark
  });

  it('should respect offset parameter', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser1, testUser2]).execute();
    await db.insert(postsTable).values([testPost1, testPost2]).execute();
    
    // Create bookmarks with delays
    await db.insert(bookmarksTable).values([{
      id: 'bookmark1',
      user_id: 'user1',
      post_id: 'post1'
    }]).execute();
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(bookmarksTable).values([{
      id: 'bookmark2',
      user_id: 'user1',
      post_id: 'post2'
    }]).execute();

    const result = await getBookmarks('user1', 10, 1);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('post1'); // Second bookmark after offset
  });

  it('should handle posts with image_urls correctly', async () => {
    // Create post with image_urls
    const postWithImages = {
      ...testPost1,
      id: 'post_with_images',
      image_urls: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg']
    };

    const bookmarkWithImages = {
      id: 'bookmark_with_images',
      user_id: 'user1',
      post_id: 'post_with_images'
    };

    await db.insert(usersTable).values([testUser1, testUser2]).execute();
    await db.insert(postsTable).values([postWithImages]).execute();
    await db.insert(bookmarksTable).values([bookmarkWithImages]).execute();

    const result = await getBookmarks('user1');

    expect(result).toHaveLength(1);
    expect(result[0].image_urls).toEqual(['http://example.com/image1.jpg', 'http://example.com/image2.jpg']);
    expect(Array.isArray(result[0].image_urls)).toBe(true);
  });
});
