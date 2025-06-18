
import { db } from '../db';
import { followsTable, usersTable } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    // Start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Delete the follow relationship
      const deleteResult = await tx.delete(followsTable)
        .where(
          and(
            eq(followsTable.follower_id, followerId),
            eq(followsTable.following_id, followingId)
          )
        )
        .execute();

      // Only update counts if a follow relationship was actually deleted
      if (deleteResult.rowCount && deleteResult.rowCount > 0) {
        // Decrease follower count for the user being unfollowed
        await tx.update(usersTable)
          .set({
            follower_count: sql`${usersTable.follower_count} - 1`,
            updated_at: new Date()
          })
          .where(eq(usersTable.id, followingId))
          .execute();

        // Decrease following count for the user doing the unfollowing
        await tx.update(usersTable)
          .set({
            following_count: sql`${usersTable.following_count} - 1`,
            updated_at: new Date()
          })
          .where(eq(usersTable.id, followerId))
          .execute();
      }
    });
  } catch (error) {
    console.error('Unfollow user failed:', error);
    throw error;
  }
};
