
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';
import { nanoid } from 'nanoid';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // Insert project record
    const result = await db.insert(projectsTable)
      .values({
        id: nanoid(),
        user_id: input.user_id,
        title: input.title,
        description: input.description,
        tech_stack: input.tech_stack || [],
        github_url: input.github_url || null,
        live_url: input.live_url || null,
        image_urls: input.image_urls || []
      })
      .returning()
      .execute();

    const project = result[0];
    return {
      ...project,
      tech_stack: project.tech_stack as string[],
      image_urls: project.image_urls as string[]
    };
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};
