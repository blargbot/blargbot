import { StoredUser, StoredUsername, UserDetails } from '../models/index.js';

export interface UserStore {
    getTodo(userId: string, skipCache?: boolean): Promise<readonly string[] | undefined>;
    addTodo(userId: string, item: string): Promise<boolean>;
    removeTodo(userId: string, index: number): Promise<boolean>;
    addPrefix(userId: string, prefix: string): Promise<boolean>;
    removePrefix(userId: string, prefix: string): Promise<boolean>;
    removeUsernames(userId: string, usernames: readonly string[] | 'all'): Promise<boolean>;
    getUsernames(userId: string, skipCache?: boolean): Promise<readonly StoredUsername[] | undefined>;
    setProp<K extends keyof StoredUser>(userId: string, key: K, value: StoredUser[K]): Promise<boolean>;
    getProp<K extends keyof StoredUser>(userId: string, key: K, skipCache?: boolean): Promise<StoredUser[K] | undefined>;
    get(userId: string, skipCache?: boolean): Promise<StoredUser | undefined>;
    reset(user: UserDetails): Promise<'inserted' | 'updated' | false>;
    upsert(user: UserDetails): Promise<'inserted' | 'updated' | false>;
    setTagReport(userId: string, tagName: string, reason: string | undefined): Promise<boolean>;
}
