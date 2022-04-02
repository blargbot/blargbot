import { ChatLogIndex } from '../models';

export interface ChatLogIndicesTable {
    add(index: ChatLogIndex): Promise<boolean>;
    get(id: string): Promise<ChatLogIndex | undefined>;
}
