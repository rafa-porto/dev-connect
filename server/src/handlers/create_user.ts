
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { nanoid } from 'nanoid';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Generate unique user ID
    const userId = nanoid();

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        id: userId,
        email: input.email,
        username: input.username,
        display_name: input.display_name,
        bio: input.bio || null,
        avatar_url: input.avatar_url || null,
        location: input.location || null,
        website: input.website || null,
        github_url: input.github_url || null,
        portfolio_url: input.portfolio_url || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
