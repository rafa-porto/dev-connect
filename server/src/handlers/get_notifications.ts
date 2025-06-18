
import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { type Notification } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getNotifications = async (userId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> => {
  try {
    const results = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.user_id, userId))
      .orderBy(desc(notificationsTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Get notifications failed:', error);
    throw error;
  }
};
