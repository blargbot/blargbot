import { ChatLogIndex } from '../models';

export interface ChatLogIndexStore {
    add(index: ChatLogIndex): Promise<boolean>;
    get(id: string): Promise<ChatLogIndex | undefined>;
}
