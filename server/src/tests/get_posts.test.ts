
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable } from '../db/schema';
import { type CreateUserInput, type CreatePostInput } from '../schema';
import { getPosts } from '../handlers/get_posts';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'Test bio',
  location: 'Test City'
};

const testUser2: CreateUserInput = {
  email: 'test2@example.com',
  username: 'testuser2',
  display_name: 'Test User 2',
  bio: 'Another test bio',
  location: 'Another City'
};

const testPost1: CreatePostInput = {
  user_id: 'user-1',
  content: 'First test post',
  code_snippet: 'console.log("hello");',
  code_language: 'javascript',
  image_urls: ['https://example.com/image1.jpg']
};

const testPost2: CreatePostInput = {
  user_id: 'user-1',
  content: 'Second test post',
  link_url: 'https://example.com',
  image_urls: []
};

const testPost3: CreatePostInput = {
  user_id: 'user-2',
  content: 'Third test post from different user',
  image_urls: []
};

describe('getPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all posts when no userId provided', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        id: 'user-1',
        ...testUser
      },
      {
        id: 'user-2',
        ...testUser2
      }
    ]).execute();

    // Create posts with staggered timestamps to ensure proper ordering
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    await db.insert(postsTable).values([
      {
        id: 'post-1',
        ...testPost1,
        created_at: new Date(baseTime.getTime()),
        updated_at: new Date(baseTime.getTime())
      },
      {
        id: 'post-2',
        ...testPost2,
        created_at: new Date(baseTime.getTime() + 1000), // 1 second later
        updated_at: new Date(baseTime.getTime() + 1000)
      },
      {
        id: 'post-3',
        ...testPost3,
        created_at: new Date(baseTime.getTime() + 2000), // 2 seconds later
        updated_at: new Date(baseTime.getTime() + 2000)
      }
    ]).execute();

    const result = await getPosts();

    expect(result).toHaveLength(3);
    expect(result[0].content).toEqual('Third test post from different user'); // Most recent first
    expect(result[1].content).toEqual('Second test post');
    expect(result[2].content).toEqual('First test post');
    
    // Verify all required fields are present
    result.forEach(post => {
      expect(post.id).toBeDefined();
      expect(post.user_id).toBeDefined();
      expect(post.content).toBeDefined();
      expect(Array.isArray(post.image_urls)).toBe(true);
      expect(post.created_at).toBeInstanceOf(Date);
      expect(typeof post.like_count).toBe('number');
      expect(typeof post.reply_count).toBe('number');
      expect(typeof post.repost_count).toBe('number');
      expect(typeof post.bookmark_count).toBe('number');
      expect(typeof post.view_count).toBe('number');
      expect(typeof post.is_pinned).toBe('boolean');
    });
  });

  it('should get posts for specific user when userId provided', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        id: 'user-1',
        ...testUser
      },
      {
        id: 'user-2',
        ...testUser2
      }
    ]).execute();

    // Create posts with staggered timestamps to ensure proper ordering
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    await db.insert(postsTable).values([
      {
        id: 'post-1',
        ...testPost1,
        created_at: new Date(baseTime.getTime()),
        updated_at: new Date(baseTime.getTime())
      },
      {
        id: 'post-2',
        ...testPost2,
        created_at: new Date(baseTime.getTime() + 1000), // 1 second later
        updated_at: new Date(baseTime.getTime() + 1000)
      },
      {
        id: 'post-3',
        ...testPost3,
        created_at: new Date(baseTime.getTime() + 2000), // 2 seconds later
        updated_at: new Date(baseTime.getTime() + 2000)
      }
    ]).execute();

    const result = await getPosts('user-1');

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('Second test post'); // Most recent first
    expect(result[1].content).toEqual('First test post');
    
    // Verify all posts belong to the specified user
    result.forEach(post => {
      expect(post.user_id).toEqual('user-1');
    });
  });

  it('should respect limit parameter', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      ...testUser
    }).execute();

    // Create posts with staggered timestamps
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    await db.insert(postsTable).values([
      {
        id: 'post-1',
        ...testPost1,
        created_at: new Date(baseTime.getTime()),
        updated_at: new Date(baseTime.getTime())
      },
      {
        id: 'post-2',
        ...testPost2,
        created_at: new Date(baseTime.getTime() + 1000),
        updated_at: new Date(baseTime.getTime() + 1000)
      }
    ]).execute();

    const result = await getPosts(undefined, 1);

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('Second test post'); // Most recent first
  });

  it('should respect offset parameter', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      ...testUser
    }).execute();

    // Create posts with staggered timestamps
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    await db.insert(postsTable).values([
      {
        id: 'post-1',
        ...testPost1,
        created_at: new Date(baseTime.getTime()),
        updated_at: new Date(baseTime.getTime())
      },
      {
        id: 'post-2',
        ...testPost2,
        created_at: new Date(baseTime.getTime() + 1000),
        updated_at: new Date(baseTime.getTime() + 1000)
      }
    ]).execute();

    const result = await getPosts(undefined, 10, 1);

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('First test post'); // Second post when offset by 1
  });

  it('should return empty array for non-existent user', async () => {
    const result = await getPosts('non-existent-user');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle posts with null/empty image_urls correctly', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      ...testUser
    }).execute();

    // Create post with empty image_urls
    await db.insert(postsTable).values({
      id: 'post-1',
      user_id: 'user-1',
      content: 'Post with no images'
    }).execute();

    const result = await getPosts();

    expect(result).toHaveLength(1);
    expect(Array.isArray(result[0].image_urls)).toBe(true);
    expect(result[0].image_urls).toEqual([]);
  });
});
