import type * as discordeno from 'discordeno';

export interface SlimDiscordMember extends discordeno.DiscordMember {
    readonly userId: string;
    readonly user: undefined;
}

export function toSlimDiscordMember<T extends discordeno.DiscordMemberWithUser>(member: T): Omit<T, 'user'> & SlimDiscordMember {
    return {
        ...member,
        user: undefined,
        userId: member.user.id
    };
}
