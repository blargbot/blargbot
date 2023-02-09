import type { UserSettings } from './UserSettings.js';

export interface IUserSettingsCache {
    getOrAdd(userId: bigint, factory: (userId: bigint) => Awaitable<UserSettings>): Awaitable<UserSettings>;
    delete(userId: bigint): Awaitable<void>;
}
