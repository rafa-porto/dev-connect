
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { followsTable, usersTable } from '../db/schema';
import { type CreateFollowInput } from '../schema';
import { createFollow } from '../handlers/create_follow';
import { eq, and } from 'drizzle-orm';

describe('createFollow', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test users
  const followerUser = {
    id: 'follower-123',
    email: 'follower@test.com',
    username: 'follower_user',
    display_name: 'Follower User',
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

  const followingUser = {
    id: 'following-456',
    email: 'following@test.com',
    username: 'following_user',
    display_name: 'Following User',
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

  const testInput: CreateFollowInput = {
    follower_id: 'follower-123',
    following_id: 'following-456'
  };

  it('should create a follow relationship', async () => {
    // Create prerequisite users
    await db.insert(usersTable).values([followerUser, followingUser]).execute();

    const result = await createFollow(testInput);

    // Verify follow record fields
    expect(result.follower_id).toEqual('follower-123');
    expect(result.following_id).toEqual('following-456');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save follow relationship to database', async () => {
    // Create prerequisite users
    await db.insert(usersTable).values([followerUser, followingUser]).execute();

    const result = await createFollow(testInput);

    // Verify record exists in database
    const follows = await db.select()
      .from(followsTable)
      .where(eq(followsTable.id, result.id))
      .execute();

    expect(follows).toHaveLength(1);
    expect(follows[0].follower_id).toEqual('follower-123');
    expect(follows[0].following_id).toEqual('following-456');
    expect(follows[0].created_at).toBeInstanceOf(Date);
  });

  it('should update user counts correctly', async () => {
    // Create users with initial counts
    await db.insert(usersTable).values([
      { ...followerUser, following_count: 5 },
      { ...followingUser, follower_count: 10 }
    ]).execute();

    await createFollow(testInput);

    // Check updated counts
    const [updatedFollower, updatedFollowing] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, 'follower-123')).execute(),
      db.select().from(usersTable).where(eq(usersTable.id, 'following-456')).execute()
    ]);

    expect(updatedFollower[0].following_count).toEqual(6);
    expect(updatedFollowing[0].follower_count).toEqual(11);
  });

  it('should reject self-follow attempts', async () => {
    // Create user
    await db.insert(usersTable).values([followerUser]).execute();

    const selfFollowInput: CreateFollowInput = {
      follower_id: 'follower-123',
      following_id: 'follower-123'
    };

    await expect(createFollow(selfFollowInput)).rejects.toThrow(/cannot follow yourself/i);
  });

  it('should reject follow when follower user does not exist', async () => {
    // Create only the following user
    await db.insert(usersTable).values([followingUser]).execute();

    await expect(createFollow(testInput)).rejects.toThrow(/follower user not found/i);
  });

  it('should reject follow when following user does not exist', async () => {
    // Create only the follower user
    await db.insert(usersTable).values([followerUser]).execute();

    await expect(createFollow(testInput)).rejects.toThrow(/following user not found/i);
  });

  it('should reject duplicate follow attempts', async () => {
    // Create prerequisite users
    await db.insert(usersTable).values([followerUser, followingUser]).execute();

    // Create first follow
    await createFollow(testInput);

    // Attempt duplicate follow
    await expect(createFollow(testInput)).rejects.toThrow(/already following this user/i);
  });

  it('should allow different users to follow the same person', async () => {
    const anotherFollower = {
      id: 'another-follower-789',
      email: 'another@test.com',
      username: 'another_user',
      display_name: 'Another User',
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

    // Create all users
    await db.insert(usersTable).values([followerUser, followingUser, anotherFollower]).execute();

    // Both users follow the same person
    await createFollow(testInput);
    await createFollow({
      follower_id: 'another-follower-789',
      following_id: 'following-456'
    });

    // Verify both follow relationships exist
    const follows = await db.select()
      .from(followsTable)
      .where(eq(followsTable.following_id, 'following-456'))
      .execute();

    expect(follows).toHaveLength(2);

    // Verify following user's follower count is updated correctly
    const updatedFollowing = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, 'following-456'))
      .execute();

    expect(updatedFollowing[0].follower_count).toEqual(2);
  });
});
