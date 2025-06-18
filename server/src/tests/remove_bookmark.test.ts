
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, bookmarksTable } from '../db/schema';
import { removeBookmark } from '../handlers/remove_bookmark';
import { eq, and } from 'drizzle-orm';

describe('removeBookmark', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove bookmark and decrement post bookmark count', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        id: 'user1',
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test post
    const post = await db.insert(postsTable)
      .values({
        id: 'post1',
        user_id: 'user1',
        content: 'Test post content',
        bookmark_count: 1
      })
      .returning()
      .execute();

    // Create bookmark
    await db.insert(bookmarksTable)
      .values({
        id: 'bookmark1',
        user_id: 'user1',
        post_id: 'post1'
      })
      .execute();

    // Remove bookmark
    await removeBookmark('user1', 'post1');

    // Verify bookmark is removed
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.user_id, 'user1'),
          eq(bookmarksTable.post_id, 'post1')
        )
      )
      .execute();

    expect(bookmarks).toHaveLength(0);

    // Verify post bookmark count is decremented
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'post1'))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].bookmark_count).toEqual(0);
  });

  it('should handle removing non-existent bookmark gracefully', async () => {
    // Create test user and post
    await db.insert(usersTable)
      .values({
        id: 'user1',
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User'
      })
      .execute();

    await db.insert(postsTable)
      .values({
        id: 'post1',
        user_id: 'user1',
        content: 'Test post content',
        bookmark_count: 0
      })
      .execute();

    // Remove non-existent bookmark - should not throw
    await removeBookmark('user1', 'post1');

    // Verify post bookmark count remains 0
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'post1'))
      .execute();

    expect(posts[0].bookmark_count).toEqual(0);
  });

  it('should only remove bookmark for specific user-post combination', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
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
      ])
      .execute();

    // Create test post
    await db.insert(postsTable)
      .values({
        id: 'post1',
        user_id: 'user1',
        content: 'Test post content',
        bookmark_count: 2
      })
      .execute();

    // Create bookmarks from both users
    await db.insert(bookmarksTable)
      .values([
        {
          id: 'bookmark1',
          user_id: 'user1',
          post_id: 'post1'
        },
        {
          id: 'bookmark2',
          user_id: 'user2',
          post_id: 'post1'
        }
      ])
      .execute();

    // Remove bookmark for user1
    await removeBookmark('user1', 'post1');

    // Verify only user1's bookmark is removed
    const user1Bookmarks = await db.select()
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.user_id, 'user1'),
          eq(bookmarksTable.post_id, 'post1')
        )
      )
      .execute();

    const user2Bookmarks = await db.select()
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.user_id, 'user2'),
          eq(bookmarksTable.post_id, 'post1')
        )
      )
      .execute();

    expect(user1Bookmarks).toHaveLength(0);
    expect(user2Bookmarks).toHaveLength(1);

    // Verify post bookmark count is decremented by 1
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'post1'))
      .execute();

    expect(posts[0].bookmark_count).toEqual(1);
  });
});
