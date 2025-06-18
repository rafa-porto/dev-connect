
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, usersTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Create test user
const createTestUser = async () => {
  const userId = nanoid();
  await db.insert(usersTable)
    .values({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User'
    })
    .execute();
  return userId;
};

// Simple test input
const createTestInput = (userId: string): CreateProjectInput => ({
  user_id: userId,
  title: 'Test Project',
  description: 'A project for testing',
  tech_stack: ['JavaScript', 'React', 'Node.js'],
  github_url: 'https://github.com/test/project',
  live_url: 'https://project.example.com',
  image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
});

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project', async () => {
    const userId = await createTestUser();
    const testInput = createTestInput(userId);
    
    const result = await createProject(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.title).toEqual('Test Project');
    expect(result.description).toEqual('A project for testing');
    expect(result.tech_stack).toEqual(['JavaScript', 'React', 'Node.js']);
    expect(result.github_url).toEqual('https://github.com/test/project');
    expect(result.live_url).toEqual('https://project.example.com');
    expect(result.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result.is_featured).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save project to database', async () => {
    const userId = await createTestUser();
    const testInput = createTestInput(userId);
    
    const result = await createProject(testInput);

    // Query database to verify project was saved
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].user_id).toEqual(userId);
    expect(projects[0].title).toEqual('Test Project');
    expect(projects[0].description).toEqual('A project for testing');
    expect(projects[0].tech_stack).toEqual(['JavaScript', 'React', 'Node.js']);
    expect(projects[0].github_url).toEqual('https://github.com/test/project');
    expect(projects[0].live_url).toEqual('https://project.example.com');
    expect(projects[0].image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(projects[0].is_featured).toEqual(false);
    expect(projects[0].created_at).toBeInstanceOf(Date);
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields', async () => {
    const userId = await createTestUser();
    const minimalInput: CreateProjectInput = {
      user_id: userId,
      title: 'Minimal Project',
      description: 'A minimal project',
      tech_stack: ['TypeScript']
    };
    
    const result = await createProject(minimalInput);

    expect(result.user_id).toEqual(userId);
    expect(result.title).toEqual('Minimal Project');
    expect(result.description).toEqual('A minimal project');
    expect(result.tech_stack).toEqual(['TypeScript']);
    expect(result.github_url).toBeNull();
    expect(result.live_url).toBeNull();
    expect(result.image_urls).toEqual([]);
    expect(result.is_featured).toEqual(false);
  });

  it('should fail with invalid user_id', async () => {
    const invalidInput: CreateProjectInput = {
      user_id: 'invalid-user-id',
      title: 'Test Project',
      description: 'A project for testing',
      tech_stack: ['JavaScript']
    };

    await expect(createProject(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
