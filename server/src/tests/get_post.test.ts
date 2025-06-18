
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable } from '../db/schema';
import { getPost } from '../handlers/get_post';

describe('getPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a post by id', async () => {
    // Create a user first
    await db.insert(usersTable).values({
      id: 'user1',
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User'
    });

    // Create a post
    const postData = {
      id: 'post1',
      user_id: 'user1',
      content: 'Test post content',
      code_snippet: 'console.log("hello");',
      code_language: 'javascript',
      image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      link_url: 'https://example.com',
      link_title: 'Example Link',
      link_description: 'An example link',
      parent_post_id: null,
      repost_id: null,
      repost_comment: null,
      like_count: 5,
      reply_count: 3,
      repost_count: 2,
      bookmark_count: 1,
      view_count: 100,
      is_pinned: false
    };

    await db.insert(postsTable).values(postData);

    const result = await getPost('post1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('post1');
    expect(result!.user_id).toBe('user1');
    expect(result!.content).toBe('Test post content');
    expect(result!.code_snippet).toBe('console.log("hello");');
    expect(result!.code_language).toBe('javascript');
    expect(result!.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result!.link_url).toBe('https://example.com');
    expect(result!.link_title).toBe('Example Link');
    expect(result!.link_description).toBe('An example link');
    expect(result!.parent_post_id).toBeNull();
    expect(result!.repost_id).toBeNull();
    expect(result!.repost_comment).toBeNull();
    expect(result!.like_count).toBe(5);
    expect(result!.reply_count).toBe(3);
    expect(result!.repost_count).toBe(2);
    expect(result!.bookmark_count).toBe(1);
    expect(result!.view_count).toBe(100);
    expect(result!.is_pinned).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent post', async () => {
    const result = await getPost('nonexistent');
    expect(result).toBeNull();
  });

  it('should handle posts with minimal data', async () => {
    // Create a user first
    await db.insert(usersTable).values({
      id: 'user2',
      email: 'minimal@example.com',
      username: 'minimaluser',
      display_name: 'Minimal User'
    });

    // Create a post with minimal required data
    await db.insert(postsTable).values({
      id: 'minimal-post',
      user_id: 'user2',
      content: 'Minimal post'
    });

    const result = await getPost('minimal-post');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('minimal-post');
    expect(result!.user_id).toBe('user2');
    expect(result!.content).toBe('Minimal post');
    expect(result!.code_snippet).toBeNull();
    expect(result!.code_language).toBeNull();
    expect(result!.image_urls).toEqual([]);
    expect(result!.link_url).toBeNull();
    expect(result!.link_title).toBeNull();
    expect(result!.link_description).toBeNull();
    expect(result!.parent_post_id).toBeNull();
    expect(result!.repost_id).toBeNull();
    expect(result!.repost_comment).toBeNull();
    expect(result!.like_count).toBe(0);
    expect(result!.reply_count).toBe(0);
    expect(result!.repost_count).toBe(0);
    expect(result!.bookmark_count).toBe(0);
    expect(result!.view_count).toBe(0);
    expect(result!.is_pinned).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle posts with reply relationships', async () => {
    // Create users
    await db.insert(usersTable).values([
      {
        id: 'user1',
        email: 'user1@example.com',
        username: 'user1',
        display_name: 'User One'
      },
      {
        id: 'user2',
        email: 'user2@example.com',
        username: 'user2',
        display_name: 'User Two'
      }
    ]);

    // Create parent post
    await db.insert(postsTable).values({
      id: 'parent-post',
      user_id: 'user1',
      content: 'Original post'
    });

    // Create reply post
    await db.insert(postsTable).values({
      id: 'reply-post',
      user_id: 'user2',
      content: 'This is a reply',
      parent_post_id: 'parent-post'
    });

    const result = await getPost('reply-post');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('reply-post');
    expect(result!.content).toBe('This is a reply');
    expect(result!.parent_post_id).toBe('parent-post');
  });

  it('should handle posts with repost data', async () => {
    // Create users
    await db.insert(usersTable).values([
      {
        id: 'user1',
        email: 'user1@example.com',
        username: 'user1',
        display_name: 'User One'
      },
      {
        id: 'user2',
        email: 'user2@example.com',
        username: 'user2',
        display_name: 'User Two'
      }
    ]);

    // Create original post
    await db.insert(postsTable).values({
      id: 'original-post',
      user_id: 'user1',
      content: 'Original content'
    });

    // Create repost
    await db.insert(postsTable).values({
      id: 'repost',
      user_id: 'user2',
      content: 'Check this out!',
      repost_id: 'original-post',
      repost_comment: 'This is amazing!'
    });

    const result = await getPost('repost');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('repost');
    expect(result!.content).toBe('Check this out!');
    expect(result!.repost_id).toBe('original-post');
    expect(result!.repost_comment).toBe('This is amazing!');
  });
});
