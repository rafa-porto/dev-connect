
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (userData: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      id: 'test-user-id',
      email: userData.email,
      username: userData.username,
      display_name: userData.display_name,
      bio: userData.bio || null,
      avatar_url: userData.avatar_url || null,
      location: userData.location || null,
      website: userData.website || null,
      github_url: userData.github_url || null,
      portfolio_url: userData.portfolio_url || null
    })
    .returning()
    .execute();
  
  return result[0];
};

const testUserData: CreateUserInput = {
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'Original bio',
  avatar_url: 'https://example.com/avatar.jpg',
  location: 'Original Location',
  website: 'https://original.com',
  github_url: 'https://github.com/original',
  portfolio_url: 'https://portfolio.original.com'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user fields', async () => {
    // Create test user first
    await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: 'test-user-id',
      display_name: 'Updated Display Name',
      bio: 'Updated bio content',
      location: 'New Location'
    };

    const result = await updateUser(updateInput);

    // Verify updated fields
    expect(result.id).toEqual('test-user-id');
    expect(result.display_name).toEqual('Updated Display Name');
    expect(result.bio).toEqual('Updated bio content');
    expect(result.location).toEqual('New Location');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify unchanged fields remain the same
    expect(result.email).toEqual('test@example.com');
    expect(result.username).toEqual('testuser');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.website).toEqual('https://original.com');
    expect(result.github_url).toEqual('https://github.com/original');
    expect(result.portfolio_url).toEqual('https://portfolio.original.com');
  });

  it('should update nullable fields to null', async () => {
    // Create test user first
    await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: 'test-user-id',
      bio: null,
      avatar_url: null,
      banner_url: null,
      location: null,
      website: null,
      github_url: null,
      portfolio_url: null
    };

    const result = await updateUser(updateInput);

    // Verify nullable fields are set to null
    expect(result.bio).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.banner_url).toBeNull();
    expect(result.location).toBeNull();
    expect(result.website).toBeNull();
    expect(result.github_url).toBeNull();
    expect(result.portfolio_url).toBeNull();

    // Verify required fields remain unchanged
    expect(result.display_name).toEqual('Test User');
    expect(result.email).toEqual('test@example.com');
    expect(result.username).toEqual('testuser');
  });

  it('should save updated user to database', async () => {
    // Create test user first
    await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: 'test-user-id',
      display_name: 'Database Updated Name',
      bio: 'Database updated bio'
    };

    await updateUser(updateInput);

    // Verify changes are persisted in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, 'test-user-id'))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].display_name).toEqual('Database Updated Name');
    expect(users[0].bio).toEqual('Database updated bio');
    expect(users[0].updated_at).toBeInstanceOf(Date);

    // Verify the updated_at timestamp is recent (within last 5 seconds)
    const now = new Date();
    const timeDiff = now.getTime() - users[0].updated_at.getTime();
    expect(timeDiff).toBeLessThan(5000);
  });

  it('should update only banner_url when provided', async () => {
    // Create test user first
    await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: 'test-user-id',
      banner_url: 'https://example.com/new-banner.jpg'
    };

    const result = await updateUser(updateInput);

    // Verify only banner_url is updated
    expect(result.banner_url).toEqual('https://example.com/new-banner.jpg');
    expect(result.display_name).toEqual('Test User');
    expect(result.bio).toEqual('Original bio');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 'non-existent-user-id',
      display_name: 'Updated Name'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update all optional fields at once', async () => {
    // Create test user first
    await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: 'test-user-id',
      display_name: 'Complete Update',
      bio: 'Completely new bio',
      avatar_url: 'https://example.com/new-avatar.jpg',
      banner_url: 'https://example.com/new-banner.jpg',
      location: 'New City, New State',
      website: 'https://newwebsite.com',
      github_url: 'https://github.com/newuser',
      portfolio_url: 'https://newportfolio.com'
    };

    const result = await updateUser(updateInput);

    // Verify all fields are updated
    expect(result.display_name).toEqual('Complete Update');
    expect(result.bio).toEqual('Completely new bio');
    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.banner_url).toEqual('https://example.com/new-banner.jpg');
    expect(result.location).toEqual('New City, New State');
    expect(result.website).toEqual('https://newwebsite.com');
    expect(result.github_url).toEqual('https://github.com/newuser');
    expect(result.portfolio_url).toEqual('https://newportfolio.com');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify unchanged fields
    expect(result.email).toEqual('test@example.com');
    expect(result.username).toEqual('testuser');
  });
});
