import type { DiscordPermissions } from '../enums.js';

export interface GetUserPermissionsThunk {
    (guildId: string, userId: string, channelId?: string): Promise<DiscordPermissions>;
}

export interface CheckMessageExistsThunk {
    (channelId: string, messageId: string): Promise<boolean>;
}
type Clear<T> = { [P in keyof T]: T[P] } & {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type EmptyObject = {};
export type ApiResult<Success extends null | object = null, Error extends null | object = null> = Clear<
    | { success: true; } & (Success extends null ? EmptyObject : Success)
    | { success: false; reason?: string; } & (Error extends null ? EmptyObject : Error)
>;
