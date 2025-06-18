
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUser } from '../handlers/get_user';

const testUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'A test user bio',
  avatar_url: 'https://example.com/avatar.jpg',
  banner_url: null,
  location: 'Test City',
  website: 'https://testuser.com',
  github_url: 'https://github.com/testuser',
  portfolio_url: null,
  is_premium: false,
  is_verified: true,
  follower_count: 50,
  following_count: 25,
  post_count: 10
};

describe('getUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when found', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await getUser('user-123');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('user-123');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.username).toEqual('testuser');
    expect(result!.display_name).toEqual('Test User');
    expect(result!.bio).toEqual('A test user bio');
    expect(result!.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result!.banner_url).toBeNull();
    expect(result!.location).toEqual('Test City');
    expect(result!.website).toEqual('https://testuser.com');
    expect(result!.github_url).toEqual('https://github.com/testuser');
    expect(result!.portfolio_url).toBeNull();
    expect(result!.is_premium).toBe(false);
    expect(result!.is_verified).toBe(true);
    expect(result!.follower_count).toEqual(50);
    expect(result!.following_count).toEqual(25);
    expect(result!.post_count).toEqual(10);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    const result = await getUser('nonexistent-user');

    expect(result).toBeNull();
  });

  it('should handle empty string user id', async () => {
    const result = await getUser('');

    expect(result).toBeNull();
  });

  it('should retrieve user with minimal data', async () => {
    const minimalUser = {
      id: 'minimal-user',
      email: 'minimal@example.com',
      username: 'minimal',
      display_name: 'Minimal User',
      bio: null,
      avatar_url: null,
      banner_url: null,
      location: null,
      website: null,
      github_url: null,
      portfolio_url: null
    };

    await db.insert(usersTable)
      .values(minimalUser)
      .execute();

    const result = await getUser('minimal-user');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('minimal-user');
    expect(result!.email).toEqual('minimal@example.com');
    expect(result!.username).toEqual('minimal');
    expect(result!.display_name).toEqual('Minimal User');
    expect(result!.bio).toBeNull();
    expect(result!.avatar_url).toBeNull();
    expect(result!.banner_url).toBeNull();
    expect(result!.location).toBeNull();
    expect(result!.website).toBeNull();
    expect(result!.github_url).toBeNull();
    expect(result!.portfolio_url).toBeNull();
    // Check default values
    expect(result!.is_premium).toBe(false);
    expect(result!.is_verified).toBe(false);
    expect(result!.follower_count).toEqual(0);
    expect(result!.following_count).toEqual(0);
    expect(result!.post_count).toEqual(0);
  });
});
