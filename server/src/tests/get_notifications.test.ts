
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notificationsTable } from '../db/schema';
import { getNotifications } from '../handlers/get_notifications';

describe('getNotifications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get notifications for a user', async () => {
    // Create test users
    const user = await db.insert(usersTable)
      .values({
        id: 'user1',
        email: 'user1@example.com',
        username: 'user1',
        display_name: 'User One'
      })
      .returning()
      .execute();

    const actor = await db.insert(usersTable)
      .values({
        id: 'actor1',
        email: 'actor1@example.com',
        username: 'actor1',
        display_name: 'Actor One'
      })
      .returning()
      .execute();

    // Create test notifications with explicit timestamps to ensure ordering
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000); // 1 second earlier

    await db.insert(notificationsTable)
      .values({
        id: 'notif1',
        user_id: 'user1',
        type: 'like',
        actor_id: 'actor1',
        message: 'Actor One liked your post',
        is_read: false,
        created_at: earlier
      })
      .execute();

    await db.insert(notificationsTable)
      .values({
        id: 'notif2',
        user_id: 'user1',
        type: 'follow',
        actor_id: 'actor1',
        message: 'Actor One started following you',
        is_read: true,
        created_at: now
      })
      .execute();

    const result = await getNotifications('user1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual('notif2'); // Most recent first (ordered by created_at desc)
    expect(result[0].user_id).toEqual('user1');
    expect(result[0].type).toEqual('follow');
    expect(result[0].actor_id).toEqual('actor1');
    expect(result[0].message).toEqual('Actor One started following you');
    expect(result[0].is_read).toEqual(true);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].id).toEqual('notif1'); 
    expect(result[1].type).toEqual('like');
    expect(result[1].is_read).toEqual(false);
  });

  it('should return empty array for user with no notifications', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        id: 'user1',
        email: 'user1@example.com',
        username: 'user1',
        display_name: 'User One'
      })
      .execute();

    const result = await getNotifications('user1');

    expect(result).toHaveLength(0);
  });

  it('should respect limit and offset parameters', async () => {
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
          id: 'actor1',
          email: 'actor1@example.com',
          username: 'actor1',
          display_name: 'Actor One'
        }
      ])
      .execute();

    // Create multiple notifications with explicit timestamps
    const now = new Date();
    await db.insert(notificationsTable)
      .values({
        id: 'notif1',
        user_id: 'user1',
        type: 'like',
        actor_id: 'actor1',
        message: 'Notification 1',
        created_at: new Date(now.getTime() - 2000)
      })
      .execute();

    await db.insert(notificationsTable)
      .values({
        id: 'notif2',
        user_id: 'user1',
        type: 'follow',
        actor_id: 'actor1',
        message: 'Notification 2',
        created_at: new Date(now.getTime() - 1000)
      })
      .execute();

    await db.insert(notificationsTable)
      .values({
        id: 'notif3',
        user_id: 'user1',
        type: 'reply',
        actor_id: 'actor1',
        message: 'Notification 3',
        created_at: now
      })
      .execute();

    // Test limit
    const limitedResult = await getNotifications('user1', 2);
    expect(limitedResult).toHaveLength(2);

    // Test offset
    const offsetResult = await getNotifications('user1', 2, 1);
    expect(offsetResult).toHaveLength(2);
    expect(offsetResult[0].id).not.toEqual(limitedResult[0].id); // Should be different due to offset
  });

  it('should only return notifications for the specified user', async () => {
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
        },
        {
          id: 'actor1',
          email: 'actor1@example.com',
          username: 'actor1',
          display_name: 'Actor One'
        }
      ])
      .execute();

    // Create notifications for different users
    await db.insert(notificationsTable)
      .values([
        {
          id: 'notif1',
          user_id: 'user1',
          type: 'like',
          actor_id: 'actor1',
          message: 'User 1 notification'
        },
        {
          id: 'notif2',
          user_id: 'user2',
          type: 'follow',
          actor_id: 'actor1',
          message: 'User 2 notification'
        }
      ])
      .execute();

    const result = await getNotifications('user1');

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('user1');
    expect(result[0].message).toEqual('User 1 notification');
  });
});
