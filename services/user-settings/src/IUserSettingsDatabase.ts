import type { UserSettings } from '@blargbot/user-settings-contract';

export interface IUserSettingsDatabase {
    get(userId: bigint): Awaitable<UserSettings | undefined>;
    update(userId: bigint, value: Partial<UserSettings>): Awaitable<void>;
    delete(userId: bigint): Awaitable<void>;
}
