import type Discord from '@blargbot/discord-types';

export interface SlimDiscordMember extends Omit<Discord.GatewayGuildMemberUpdateDispatchData, 'user' | 'guild_id'> {
    readonly userId: string;
    readonly user: undefined;
}

export function toSlimDiscordMember<T extends Omit<Discord.GatewayGuildMemberUpdateDispatchData, 'guild_id'> & { user: Discord.APIUser; }>(member: T): Omit<T, 'user'> & SlimDiscordMember {
    return {
        ...member,
        user: undefined,
        guild_id: undefined,
        userId: member.user.id
    };
}
