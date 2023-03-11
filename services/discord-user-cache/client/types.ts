import type Discord from '@blargbot/discord-types';

export interface UserCacheCountResponse {
    readonly userCount: number;
}

export type UserCacheUserResponse = Discord.APIUser;
