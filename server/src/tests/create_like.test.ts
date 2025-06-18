
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, likesTable } from '../db/schema';
import { type CreateLikeInput } from '../schema';
import { createLike } from '../handlers/create_like';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Test data
const testUser = {
  id: randomUUID(),
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  bio: null,
  avatar_url: null,
  banner_url: null,
  location: null,
  website: null,
  github_url: null,
  portfolio_url: null
};

const testPost = {
  id: randomUUID(),
  user_id: testUser.id,
  content: 'Test post content',
  code_snippet: null,
  code_language: null,
  image_urls: [],
  link_url: null,
  link_title: null,
  link_description: null,
  parent_post_id: null,
  repost_id: null,
  repost_comment: null
};

const testInput: CreateLikeInput = {
  user_id: testUser.id,
  post_id: testPost.id
};

describe('createLike', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create prerequisite post
    await db.insert(postsTable).values(testPost).execute();
  });

  afterEach(resetDB);

  it('should create a like', async () => {
    const result = await createLike(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUser.id);
    expect(result.post_id).toEqual(testPost.id);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save like to database', async () => {
    const result = await createLike(testInput);

    // Query database to verify like was created
    const likes = await db.select()
      .from(likesTable)
      .where(eq(likesTable.id, result.id))
      .execute();

    expect(likes).toHaveLength(1);
    expect(likes[0].user_id).toEqual(testUser.id);
    expect(likes[0].post_id).toEqual(testPost.id);
    expect(likes[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const invalidInput: CreateLikeInput = {
      user_id: randomUUID(),
      post_id: testPost.id
    };

    await expect(createLike(invalidInput)).rejects.toThrow(/user.*not found/i);
  });

  it('should throw error when post does not exist', async () => {
    const invalidInput: CreateLikeInput = {
      user_id: testUser.id,
      post_id: randomUUID()
    };

    await expect(createLike(invalidInput)).rejects.toThrow(/post.*not found/i);
  });

  it('should throw error when like already exists', async () => {
    // Create initial like
    await createLike(testInput);

    // Attempt to create duplicate like
    await expect(createLike(testInput)).rejects.toThrow(/already liked/i);
  });

  it('should allow different users to like the same post', async () => {
    // Create second user
    const secondUser = {
      ...testUser,
      id: randomUUID(),
      email: 'test2@example.com',
      username: 'testuser2',
      display_name: 'Test User 2'
    };

    await db.insert(usersTable).values(secondUser).execute();

    // First user likes the post
    const firstLike = await createLike(testInput);

    // Second user likes the same post
    const secondInput: CreateLikeInput = {
      user_id: secondUser.id,
      post_id: testPost.id
    };
    const secondLike = await createLike(secondInput);

    // Both likes should exist
    expect(firstLike.id).not.toEqual(secondLike.id);
    expect(firstLike.user_id).toEqual(testUser.id);
    expect(secondLike.user_id).toEqual(secondUser.id);
    expect(firstLike.post_id).toEqual(testPost.id);
    expect(secondLike.post_id).toEqual(testPost.id);

    // Verify both exist in database
    const likes = await db.select()
      .from(likesTable)
      .where(eq(likesTable.post_id, testPost.id))
      .execute();

    expect(likes).toHaveLength(2);
  });

  it('should allow same user to like different posts', async () => {
    // Create second post
    const secondPost = {
      ...testPost,
      id: randomUUID(),
      content: 'Second test post'
    };

    await db.insert(postsTable).values(secondPost).execute();

    // User likes first post
    const firstLike = await createLike(testInput);

    // User likes second post
    const secondInput: CreateLikeInput = {
      user_id: testUser.id,
      post_id: secondPost.id
    };
    const secondLike = await createLike(secondInput);

    // Both likes should exist
    expect(firstLike.id).not.toEqual(secondLike.id);
    expect(firstLike.post_id).toEqual(testPost.id);
    expect(secondLike.post_id).toEqual(secondPost.id);
    expect(firstLike.user_id).toEqual(testUser.id);
    expect(secondLike.user_id).toEqual(testUser.id);

    // Verify both exist in database
    const likes = await db.select()
      .from(likesTable)
      .where(eq(likesTable.user_id, testUser.id))
      .execute();

    expect(likes).toHaveLength(2);
  });
});
