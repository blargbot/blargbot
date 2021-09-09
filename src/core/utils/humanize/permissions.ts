import { Permissions, PermissionString } from 'discord.js';

export function permissions(permissions: bigint | readonly PermissionString[] | Permissions, hideAdminUnlessAlone = false): string[] {
    permissions = typeof permissions === 'bigint' ? new Permissions(permissions)
        : Array.isArray(permissions) ? new Permissions(permissions)
            : new Permissions(permissions);

    const hasAdmin = permissions.has('ADMINISTRATOR');
    if (hasAdmin)
        permissions.remove('ADMINISTRATOR');
    if (permissions.bitfield === 0n && hideAdminUnlessAlone)
        return [permMap['ADMINISTRATOR']];

    const result = permissions.toArray().map(p => permMap[p]);
    if (hasAdmin && !hideAdminUnlessAlone)
        result.push(permMap['ADMINISTRATOR']);
    return result;
}

/* eslint-disable @typescript-eslint/naming-convention */
const permMap: Record<PermissionString, string> = {
    ADD_REACTIONS: 'add reactions',
    ADMINISTRATOR: 'administrator',
    ATTACH_FILES: 'attach files',
    BAN_MEMBERS: 'ban members',
    CHANGE_NICKNAME: 'change my nickname',
    CONNECT: 'connect to voice',
    CREATE_INSTANT_INVITE: 'create invites',
    DEAFEN_MEMBERS: 'deafen users',
    EMBED_LINKS: 'send embeds',
    KICK_MEMBERS: 'kick members',
    MANAGE_CHANNELS: 'manage channels',
    MANAGE_EMOJIS_AND_STICKERS: 'manage emojis/stickers',
    MANAGE_GUILD: 'manage server',
    MANAGE_MESSAGES: 'manage messages',
    MANAGE_NICKNAMES: 'manage nicknames',
    MANAGE_ROLES: 'manage roles',
    MANAGE_THREADS: 'manage threads',
    MANAGE_WEBHOOKS: 'manage webhooks',
    MENTION_EVERYONE: 'mention everyone',
    MOVE_MEMBERS: 'move members',
    MUTE_MEMBERS: 'mute members',
    PRIORITY_SPEAKER: 'be a priority speaker',
    READ_MESSAGE_HISTORY: 'read message history',
    REQUEST_TO_SPEAK: 'request to speak',
    SEND_MESSAGES: 'send messages',
    SEND_TTS_MESSAGES: 'send text-to-speach messages',
    SPEAK: 'speak',
    STREAM: 'stream',
    USE_APPLICATION_COMMANDS: 'use application commands',
    USE_EXTERNAL_EMOJIS: 'use external emojis',
    USE_EXTERNAL_STICKERS: 'use external stickers',
    USE_PRIVATE_THREADS: 'use private threads',
    USE_PUBLIC_THREADS: 'use public threads',
    USE_VAD: 'use voice activity',
    VIEW_AUDIT_LOG: 'view the audit log',
    VIEW_CHANNEL: 'view channel',
    VIEW_GUILD_INSIGHTS: 'view insights'
};
/* eslint-enable @typescript-eslint/naming-convention */
