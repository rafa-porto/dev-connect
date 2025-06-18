
import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const markNotificationRead = async (notificationId: string, userId: string): Promise<void> => {
  try {
    // Update notification to mark as read, but only if it belongs to the user
    await db.update(notificationsTable)
      .set({ 
        is_read: true 
      })
      .where(
        and(
          eq(notificationsTable.id, notificationId),
          eq(notificationsTable.user_id, userId)
        )
      )
      .execute();
  } catch (error) {
    console.error('Mark notification read failed:', error);
    throw error;
  }
};
