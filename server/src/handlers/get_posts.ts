
import { type Post } from '../schema';

export declare function getPosts(userId?: string, limit?: number, offset?: number): Promise<Post[]>;
