
import { type Post } from '../schema';

export declare function getPost(postId: string): Promise<Post | null>;
