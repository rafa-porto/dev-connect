
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable } from '../db/schema';
import { getProjects } from '../handlers/get_projects';

// Test data
const testUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User'
};

const testProject1 = {
  id: 'project-1',
  user_id: 'user-1',
  title: 'My First Project',
  description: 'A simple web application',
  tech_stack: ['React', 'TypeScript', 'Node.js'],
  github_url: 'https://github.com/user/project1',
  live_url: 'https://project1.com',
  image_urls: ['https://example.com/image1.jpg']
};

const testProject2 = {
  id: 'project-2',
  user_id: 'user-1',
  title: 'Second Project',
  description: 'Another cool project',
  tech_stack: ['Vue', 'JavaScript'],
  github_url: null,
  live_url: null,
  image_urls: []
};

const otherUserProject = {
  id: 'project-3',
  user_id: 'other-user',
  title: 'Other User Project',
  description: 'Should not be returned',
  tech_stack: ['Angular'],
  github_url: null,
  live_url: null,
  image_urls: []
};

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return projects for a specific user', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test projects
    await db.insert(projectsTable).values([
      testProject1,
      testProject2
    ]).execute();

    const result = await getProjects('user-1');

    expect(result).toHaveLength(2);
    
    // Verify project data
    const project1 = result.find(p => p.id === 'project-1');
    expect(project1).toBeDefined();
    expect(project1!.title).toEqual('My First Project');
    expect(project1!.description).toEqual('A simple web application');
    expect(project1!.tech_stack).toEqual(['React', 'TypeScript', 'Node.js']);
    expect(project1!.github_url).toEqual('https://github.com/user/project1');
    expect(project1!.live_url).toEqual('https://project1.com');
    expect(project1!.image_urls).toEqual(['https://example.com/image1.jpg']);
    expect(project1!.is_featured).toEqual(false);
    expect(project1!.created_at).toBeInstanceOf(Date);
    expect(project1!.updated_at).toBeInstanceOf(Date);

    const project2 = result.find(p => p.id === 'project-2');
    expect(project2).toBeDefined();
    expect(project2!.title).toEqual('Second Project');
    expect(project2!.tech_stack).toEqual(['Vue', 'JavaScript']);
    expect(project2!.github_url).toBeNull();
    expect(project2!.live_url).toBeNull();
    expect(project2!.image_urls).toEqual([]);
  });

  it('should return empty array for user with no projects', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    const result = await getProjects('user-1');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return projects for the specified user', async () => {
    // Create test users
    await db.insert(usersTable).values([
      testUser,
      { ...testUser, id: 'other-user', email: 'other@example.com', username: 'otheruser' }
    ]).execute();

    // Create projects for both users
    await db.insert(projectsTable).values([
      testProject1,
      otherUserProject
    ]).execute();

    const result = await getProjects('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('project-1');
    expect(result[0].user_id).toEqual('user-1');
  });

  it('should return projects ordered by created_at descending', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create projects with different timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

    await db.insert(projectsTable).values([
      { ...testProject1, created_at: earlier },
      { ...testProject2, created_at: now }
    ]).execute();

    const result = await getProjects('user-1');

    expect(result).toHaveLength(2);
    // More recent project should come first
    expect(result[0].id).toEqual('project-2');
    expect(result[1].id).toEqual('project-1');
  });
});
