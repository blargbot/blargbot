import { StoredUser, StoredUsername, StoredUserSettings, UserDetails } from '../models';

export interface UserStore {
    getTodo(userId: string, skipCache?: boolean): Promise<readonly string[] | undefined>;
    addTodo(userId: string, item: string): Promise<boolean>;
    removeTodo(userId: string, index: number): Promise<boolean>;
    addPrefix(userId: string, prefix: string): Promise<boolean>;
    removePrefix(userId: string, prefix: string): Promise<boolean>;
    removeUsernames(userId: string, usernames: readonly string[] | 'all'): Promise<boolean>;
    getUsernames(userId: string, skipCache?: boolean): Promise<readonly StoredUsername[] | undefined>;
    setSetting<K extends keyof StoredUserSettings>(userId: string, key: K, value: StoredUserSettings[K]): Promise<boolean>;
    getSetting<K extends keyof StoredUserSettings>(userId: string, key: K, skipCache?: boolean): Promise<StoredUserSettings[K] | undefined>;
    get(userId: string, skipCache?: boolean): Promise<StoredUser | undefined>;
    upsert(user: UserDetails): Promise<'inserted' | 'updated' | false>;
    setTagReport(userId: string, tagName: string, reason: string | undefined): Promise<boolean>;
}
