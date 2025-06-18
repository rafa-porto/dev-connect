
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, usersTable, postsTable } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

describe('createBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a bookmark', async () => {
    // Create test user
    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User'
    }).execute();

    // Create test post
    const postId = randomUUID();
    await db.insert(postsTable).values({
      id: postId,
      user_id: userId,
      content: 'Test post content'
    }).execute();

    const testInput: CreateBookmarkInput = {
      user_id: userId,
      post_id: postId
    };

    const result = await createBookmark(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.post_id).toEqual(postId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save bookmark to database', async () => {
    // Create test user
    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User'
    }).execute();

    // Create test post
    const postId = randomUUID();
    await db.insert(postsTable).values({
      id: postId,
      user_id: userId,
      content: 'Test post content'
    }).execute();

    const testInput: CreateBookmarkInput = {
      user_id: userId,
      post_id: postId
    };

    const result = await createBookmark(testInput);

    // Query using proper drizzle syntax
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].user_id).toEqual(userId);
    expect(bookmarks[0].post_id).toEqual(postId);
    expect(bookmarks[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    // Create test post without user
    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User'
    }).execute();

    const postId = randomUUID();
    await db.insert(postsTable).values({
      id: postId,
      user_id: userId,
      content: 'Test post content'
    }).execute();

    const testInput: CreateBookmarkInput = {
      user_id: 'nonexistent-user-id',
      post_id: postId
    };

    await expect(createBookmark(testInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when post does not exist', async () => {
    // Create test user
    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User'
    }).execute();

    const testInput: CreateBookmarkInput = {
      user_id: userId,
      post_id: 'nonexistent-post-id'
    };

    await expect(createBookmark(testInput)).rejects.toThrow(/post not found/i);
  });
});
