
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof usersTable.$inferInsert> = {
      updated_at: new Date()
    };

    // Only include fields that are provided in the input
    if (input.display_name !== undefined) {
      updateData.display_name = input.display_name;
    }
    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }
    if (input.avatar_url !== undefined) {
      updateData.avatar_url = input.avatar_url;
    }
    if (input.banner_url !== undefined) {
      updateData.banner_url = input.banner_url;
    }
    if (input.location !== undefined) {
      updateData.location = input.location;
    }
    if (input.website !== undefined) {
      updateData.website = input.website;
    }
    if (input.github_url !== undefined) {
      updateData.github_url = input.github_url;
    }
    if (input.portfolio_url !== undefined) {
      updateData.portfolio_url = input.portfolio_url;
    }

    // Update the user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};
