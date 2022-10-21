import { IFormattable, FormatString } from '@blargbot/domain/messages/index';
import { Constants, Permission } from 'eris';

export function permissions(permissions: bigint | ReadonlyArray<keyof Constants['Permissions']> | Permission, hideAdminUnlessAlone = false): Array<IFormattable<string>> {
    let flags = typeof permissions === 'bigint' ? permissions
        : Array.isArray(permissions) ? permissions.reduce((p, c) => p | Constants.Permissions[c], 0n)
            : permissions.allow;

    if (hideAdminUnlessAlone && flags !== Constants.Permissions.administrator)
        flags &= ~Constants.Permissions.administrator; // remove admin flag

    return permDisplay
        .filter(x => (flags & x.value) === x.value)
        .map(x => x.display);
}

const displayMap: { [P in keyof typeof Constants['Permissions']]: string } = {
    addReactions: 'add reactions',
    administrator: 'administrator',
    attachFiles: 'attach files',
    banMembers: 'ban members',
    changeNickname: 'change my nickname',
    voiceConnect: 'connect to voice',
    createInstantInvite: 'create invites',
    voiceDeafenMembers: 'deafen users',
    embedLinks: 'send embeds',
    kickMembers: 'kick members',
    manageChannels: 'manage channels',
    manageEmojisAndStickers: 'manage emojis/stickers',
    manageGuild: 'manage server',
    manageMessages: 'manage messages',
    manageNicknames: 'manage nicknames',
    manageRoles: 'manage roles',
    manageThreads: 'manage threads',
    manageWebhooks: 'manage webhooks',
    mentionEveryone: 'mention everyone',
    voiceMoveMembers: 'move members',
    voiceMuteMembers: 'mute members',
    voicePrioritySpeaker: 'be a priority speaker',
    readMessageHistory: 'read message history',
    voiceRequestToSpeak: 'request to speak',
    sendMessages: 'send messages',
    sendTTSMessages: 'send text-to-speech messages',
    voiceSpeak: 'speak',
    stream: 'stream',
    useApplicationCommands: 'use application commands',
    useExternalEmojis: 'use external emojis',
    useExternalStickers: 'use external stickers',
    voiceUseVAD: 'use voice activity',
    viewAuditLog: 'view the audit log',
    viewChannel: 'view channel',
    viewGuildInsights: 'view insights',
    createPrivateThreads: 'create private threads',
    createPublicThreads: 'create public threads',
    sendMessagesInThreads: 'send messages in threads',
    startEmbeddedActivities: 'start embedded activities',
    all: 'all permissions',
    allGuild: 'all guild permissions',
    allText: 'all text permissions',
    allVoice: 'all voice permissions',
    externalEmojis: 'use external emojis',
    manageEmojis: 'manage emojis',
    manageEvents: 'manage events',
    moderateMembers: 'moderate guild members',
    readMessages: 'read messages',
    useSlashCommands: 'use slash commands',
    viewAuditLogs: 'view audit logs',
    voiceStream: 'voice stream'
};

function isPowerOf2(v: bigint): boolean {
    return v !== 0n && (v & v - 1n) === 0n; // idk i found it on s/o
}

const permDisplay = Object.entries(displayMap)
    .map(x => ({
        id: x[0],
        display: x[1],
        value: Constants.Permissions[x[0]]
    }))
    .filter(x => isPowerOf2(x.value)) // Remove any aggregate permissions eris provides, like "all"
    .map(x => ({
        value: x.value,
        display: FormatString.create(`constants.discord.permission.${x.id}`, x.display)
    }));
