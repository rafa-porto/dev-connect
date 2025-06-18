
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, usersTable } from '../db/schema';
import { type CreatePostInput } from '../schema';
import { createPost } from '../handlers/create_post';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

describe('createPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;
  let testInput: CreatePostInput;

  beforeEach(async () => {
    // Create test user first
    testUserId = nanoid();
    await db.insert(usersTable)
      .values({
        id: testUserId,
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User'
      })
      .execute();

    testInput = {
      user_id: testUserId,
      content: 'This is a test post content',
      code_snippet: 'console.log("Hello World");',
      code_language: 'javascript',
      image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      link_url: 'https://example.com'
    };
  });

  it('should create a basic post', async () => {
    const result = await createPost(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.content).toEqual('This is a test post content');
    expect(result.code_snippet).toEqual('console.log("Hello World");');
    expect(result.code_language).toEqual('javascript');
    expect(result.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result.link_url).toEqual('https://example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.like_count).toEqual(0);
    expect(result.reply_count).toEqual(0);
    expect(result.repost_count).toEqual(0);
    expect(result.bookmark_count).toEqual(0);
    expect(result.view_count).toEqual(0);
    expect(result.is_pinned).toBe(false);
  });

  it('should save post to database', async () => {
    const result = await createPost(testInput);

    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].user_id).toEqual(testUserId);
    expect(posts[0].content).toEqual('This is a test post content');
    expect(posts[0].code_snippet).toEqual('console.log("Hello World");');
    expect(posts[0].code_language).toEqual('javascript');
    expect(posts[0].link_url).toEqual('https://example.com');
    expect(posts[0].created_at).toBeInstanceOf(Date);
  });

  it('should create a reply post', async () => {
    // Create parent post first
    const parentPost = await createPost({
      user_id: testUserId,
      content: 'This is the parent post'
    });

    const replyInput: CreatePostInput = {
      user_id: testUserId,
      content: 'This is a reply',
      parent_post_id: parentPost.id
    };

    const result = await createPost(replyInput);

    expect(result.parent_post_id).toEqual(parentPost.id);
    expect(result.content).toEqual('This is a reply');
    expect(result.user_id).toEqual(testUserId);
  });

  it('should create a repost', async () => {
    // Create original post first  
    const originalPost = await createPost({
      user_id: testUserId,
      content: 'Original post content'
    });

    const repostInput: CreatePostInput = {
      user_id: testUserId,
      content: 'Repost comment',
      repost_id: originalPost.id,
      repost_comment: 'This is why I\'m reposting'
    };

    const result = await createPost(repostInput);

    expect(result.repost_id).toEqual(originalPost.id);
    expect(result.repost_comment).toEqual('This is why I\'m reposting');
    expect(result.content).toEqual('Repost comment');
    expect(result.user_id).toEqual(testUserId);
  });

  it('should handle optional fields correctly', async () => {
    const minimalInput: CreatePostInput = {
      user_id: testUserId,
      content: 'Just basic content'
    };

    const result = await createPost(minimalInput);

    expect(result.code_snippet).toBeNull();
    expect(result.code_language).toBeNull();
    expect(result.image_urls).toEqual([]);
    expect(result.link_url).toBeNull();
    expect(result.parent_post_id).toBeNull();
    expect(result.repost_id).toBeNull();
    expect(result.repost_comment).toBeNull();
  });

  it('should reject post for non-existent user', async () => {
    const invalidInput: CreatePostInput = {
      user_id: 'non-existent-user-id',
      content: 'This should fail'
    };

    await expect(createPost(invalidInput)).rejects.toThrow(/user not found/i);
  });

  it('should reject reply to non-existent parent post', async () => {
    const invalidReplyInput: CreatePostInput = {
      user_id: testUserId,
      content: 'Reply to nowhere',
      parent_post_id: 'non-existent-post-id'
    };

    await expect(createPost(invalidReplyInput)).rejects.toThrow(/parent post not found/i);
  });

  it('should reject repost of non-existent post', async () => {
    const invalidRepostInput: CreatePostInput = {
      user_id: testUserId,
      content: 'Repost of nothing',
      repost_id: 'non-existent-post-id'
    };

    await expect(createPost(invalidRepostInput)).rejects.toThrow(/repost target not found/i);
  });
});
