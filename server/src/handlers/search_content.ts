
import { type SearchInput } from '../schema';

export declare function searchContent(input: SearchInput): Promise<{
  posts?: any[];
  users?: any[];
  hashtags?: any[];
}>;
