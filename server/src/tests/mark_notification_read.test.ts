
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notificationsTable, postsTable } from '../db/schema';
import { markNotificationRead } from '../handlers/mark_notification_read';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

describe('markNotificationRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark notification as read', async () => {
    // Create test users
    const userId = randomUUID();
    const actorId = randomUUID();
    
    await db.insert(usersTable).values([
      {
        id: userId,
        email: 'user@test.com',
        username: 'testuser',
        display_name: 'Test User'
      },
      {
        id: actorId,
        email: 'actor@test.com',
        username: 'actor',
        display_name: 'Actor User'
      }
    ]).execute();

    // Create notification
    const notificationId = randomUUID();
    await db.insert(notificationsTable).values({
      id: notificationId,
      user_id: userId,
      type: 'follow',
      actor_id: actorId,
      message: 'Test notification',
      is_read: false
    }).execute();

    // Mark notification as read
    await markNotificationRead(notificationId, userId);

    // Verify notification is marked as read
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].is_read).toBe(true);
  });

  it('should not mark notification as read for wrong user', async () => {
    // Create test users
    const userId = randomUUID();
    const wrongUserId = randomUUID();
    const actorId = randomUUID();
    
    await db.insert(usersTable).values([
      {
        id: userId,
        email: 'user@test.com',
        username: 'testuser',
        display_name: 'Test User'
      },
      {
        id: wrongUserId,
        email: 'wrong@test.com',
        username: 'wronguser',
        display_name: 'Wrong User'
      },
      {
        id: actorId,
        email: 'actor@test.com',
        username: 'actor',
        display_name: 'Actor User'
      }
    ]).execute();

    // Create notification for userId
    const notificationId = randomUUID();
    await db.insert(notificationsTable).values({
      id: notificationId,
      user_id: userId,
      type: 'like',
      actor_id: actorId,
      message: 'Test notification',
      is_read: false
    }).execute();

    // Try to mark notification as read with wrong user ID
    await markNotificationRead(notificationId, wrongUserId);

    // Verify notification is still unread
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].is_read).toBe(false);
  });

  it('should handle non-existent notification gracefully', async () => {
    // Create test user
    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      email: 'user@test.com',
      username: 'testuser',
      display_name: 'Test User'
    }).execute();

    const nonExistentId = randomUUID();

    // Should not throw error for non-existent notification
    await expect(markNotificationRead(nonExistentId, userId)).resolves.toBeUndefined();
  });

  it('should mark notification with post_id as read', async () => {
    // Create test users
    const userId = randomUUID();
    const actorId = randomUUID();
    const postId = randomUUID();
    
    await db.insert(usersTable).values([
      {
        id: userId,
        email: 'user@test.com',
        username: 'testuser',
        display_name: 'Test User'
      },
      {
        id: actorId,
        email: 'actor@test.com',
        username: 'actor',
        display_name: 'Actor User'
      }
    ]).execute();

    // Create post first (required for foreign key constraint)
    await db.insert(postsTable).values({
      id: postId,
      user_id: userId,
      content: 'Test post content',
      image_urls: [],
      like_count: 0,
      reply_count: 0,
      repost_count: 0,
      bookmark_count: 0,
      view_count: 0,
      is_pinned: false
    }).execute();

    // Create notification with post_id
    const notificationId = randomUUID();
    await db.insert(notificationsTable).values({
      id: notificationId,
      user_id: userId,
      type: 'reply',
      actor_id: actorId,
      post_id: postId,
      message: 'Someone replied to your post',
      is_read: false
    }).execute();

    // Mark notification as read
    await markNotificationRead(notificationId, userId);

    // Verify notification is marked as read
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].is_read).toBe(true);
    expect(notifications[0].post_id).toBe(postId);
  });
});
