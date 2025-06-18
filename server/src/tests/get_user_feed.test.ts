
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, followsTable } from '../db/schema';
import { type GetFeedInput } from '../schema';
import { getUserFeed } from '../handlers/get_user_feed';

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

const testUser3 = {
  id: 'user3',
  email: 'user3@example.com',
  username: 'user3',
  display_name: 'User Three',
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
  user_id: 'user1',
  content: 'Post by user1',
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
  content: 'Post by user2',
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

const testPost3 = {
  id: 'post3',
  user_id: 'user3',
  content: 'Post by user3',
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

const testFollow1 = {
  id: 'follow1',
  follower_id: 'user1',
  following_id: 'user2'
};

describe('getUserFeed', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user\'s own posts when they follow no one', async () => {
    // Create users and posts
    await db.insert(usersTable).values([testUser1, testUser2]).execute();
    await db.insert(postsTable).values([testPost1, testPost2]).execute();

    const input: GetFeedInput = {
      user_id: 'user1',
      limit: 10,
      offset: 0
    };

    const result = await getUserFeed(input);

    // Should only return user1's own post
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('post1');
    expect(result[0].user_id).toEqual('user1');
    expect(result[0].content).toEqual('Post by user1');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(Array.isArray(result[0].image_urls)).toBe(true);
  });

  it('should return posts from followed users and own posts', async () => {
    // Create users, posts, and follow relationship
    await db.insert(usersTable).values([testUser1, testUser2, testUser3]).execute();
    await db.insert(postsTable).values([testPost1, testPost2, testPost3]).execute();
    await db.insert(followsTable).values([testFollow1]).execute();

    const input: GetFeedInput = {
      user_id: 'user1',
      limit: 10,
      offset: 0
    };

    const result = await getUserFeed(input);

    // Should return posts from user1 (own) and user2 (followed), but not user3
    expect(result).toHaveLength(2);
    
    const userIds = result.map(post => post.user_id).sort();
    expect(userIds).toEqual(['user1', 'user2']);
    
    // Check that posts are ordered by creation date (newest first)
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
  });

  it('should respect pagination limits', async () => {
    // Create users and multiple posts
    await db.insert(usersTable).values([testUser1]).execute();
    
    // Create multiple posts for pagination test
    const multiplePosts = [];
    for (let i = 1; i <= 5; i++) {
      multiplePosts.push({
        ...testPost1,
        id: `post${i}`,
        content: `Post ${i} by user1`
      });
    }
    
    await db.insert(postsTable).values(multiplePosts).execute();

    const input: GetFeedInput = {
      user_id: 'user1',
      limit: 3,
      offset: 0
    };

    const result = await getUserFeed(input);

    expect(result).toHaveLength(3);
    result.forEach(post => {
      expect(post.user_id).toEqual('user1');
      expect(post.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle pagination offset correctly', async () => {
    // Create users and multiple posts
    await db.insert(usersTable).values([testUser1]).execute();
    
    const multiplePosts = [];
    for (let i = 1; i <= 5; i++) {
      multiplePosts.push({
        ...testPost1,
        id: `post${i}`,
        content: `Post ${i} by user1`
      });
    }
    
    await db.insert(postsTable).values(multiplePosts).execute();

    // Get first page
    const firstPage = await getUserFeed({
      user_id: 'user1',
      limit: 2,
      offset: 0
    });

    // Get second page
    const secondPage = await getUserFeed({
      user_id: 'user1',
      limit: 2,
      offset: 2
    });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(2);
    
    // Ensure no overlap between pages
    const firstPageIds = firstPage.map(post => post.id);
    const secondPageIds = secondPage.map(post => post.id);
    expect(firstPageIds).not.toEqual(secondPageIds);
  });

  it('should return empty array when user has no posts and follows no one', async () => {
    // Create user but no posts or follows
    await db.insert(usersTable).values([testUser1]).execute();

    const input: GetFeedInput = {
      user_id: 'user1',
      limit: 10,
      offset: 0
    };

    const result = await getUserFeed(input);

    expect(result).toHaveLength(0);
  });

  it('should handle multiple follows correctly', async () => {
    // Create users
    await db.insert(usersTable).values([testUser1, testUser2, testUser3]).execute();
    
    // Create posts for each user
    await db.insert(postsTable).values([testPost1, testPost2, testPost3]).execute();
    
    // User1 follows both user2 and user3
    await db.insert(followsTable).values([
      { id: 'follow1', follower_id: 'user1', following_id: 'user2' },
      { id: 'follow2', follower_id: 'user1', following_id: 'user3' }
    ]).execute();

    const input: GetFeedInput = {
      user_id: 'user1',
      limit: 10,
      offset: 0
    };

    const result = await getUserFeed(input);

    // Should return posts from all three users (user1's own + user2 + user3)
    expect(result).toHaveLength(3);
    
    const userIds = result.map(post => post.user_id).sort();
    expect(userIds).toEqual(['user1', 'user2', 'user3']);
  });
});
