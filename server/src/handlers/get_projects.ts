
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type Project } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getProjects = async (userId: string): Promise<Project[]> => {
  try {
    const results = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.user_id, userId))
      .orderBy(desc(projectsTable.created_at))
      .execute();

    return results.map(project => ({
      ...project,
      tech_stack: project.tech_stack as string[],
      image_urls: project.image_urls as string[]
    }));
  } catch (error) {
    console.error('Get projects failed:', error);
    throw error;
  }
};
