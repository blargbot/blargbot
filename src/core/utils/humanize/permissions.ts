import { Constants, Permission } from 'eris';

export function permissions(permissions: bigint | ReadonlyArray<keyof Constants[`Permissions`]> | Permission, hideAdminUnlessAlone = false): string[] {
    let flags = typeof permissions === `bigint` ? permissions
        : Array.isArray(permissions) ? permissions.reduce((p, c) => p | Constants.Permissions[c], 0n)
            : permissions.allow;

    if (hideAdminUnlessAlone && flags !== Constants.Permissions.administrator)
        flags &= ~Constants.Permissions.administrator; // remove admin flag

    return Object.keys(permMap)
        .map(BigInt)
        .filter(f => (flags & f) === f)
        .map(f => permMap[f.toString() as keyof typeof permMap]);
}

const permMap = {
    [Constants.Permissions.addReactions.toString()]: `add reactions`,
    [Constants.Permissions.administrator.toString()]: `administrator`,
    [Constants.Permissions.attachFiles.toString()]: `attach files`,
    [Constants.Permissions.banMembers.toString()]: `ban members`,
    [Constants.Permissions.changeNickname.toString()]: `change my nickname`,
    [Constants.Permissions.voiceConnect.toString()]: `connect to voice`,
    [Constants.Permissions.createInstantInvite.toString()]: `create invites`,
    [Constants.Permissions.voiceDeafenMembers.toString()]: `deafen users`,
    [Constants.Permissions.embedLinks.toString()]: `send embeds`,
    [Constants.Permissions.kickMembers.toString()]: `kick members`,
    [Constants.Permissions.manageChannels.toString()]: `manage channels`,
    [Constants.Permissions.manageEmojisAndStickers.toString()]: `manage emojis/stickers`,
    [Constants.Permissions.manageGuild.toString()]: `manage server`,
    [Constants.Permissions.manageMessages.toString()]: `manage messages`,
    [Constants.Permissions.manageNicknames.toString()]: `manage nicknames`,
    [Constants.Permissions.manageRoles.toString()]: `manage roles`,
    [Constants.Permissions.manageThreads.toString()]: `manage threads`,
    [Constants.Permissions.manageWebhooks.toString()]: `manage webhooks`,
    [Constants.Permissions.mentionEveryone.toString()]: `mention everyone`,
    [Constants.Permissions.voiceMoveMembers.toString()]: `move members`,
    [Constants.Permissions.voiceMuteMembers.toString()]: `mute members`,
    [Constants.Permissions.voicePrioritySpeaker.toString()]: `be a priority speaker`,
    [Constants.Permissions.readMessageHistory.toString()]: `read message history`,
    [Constants.Permissions.voiceRequestToSpeak.toString()]: `request to speak`,
    [Constants.Permissions.sendMessages.toString()]: `send messages`,
    [Constants.Permissions.sendTTSMessages.toString()]: `send text-to-speach messages`,
    [Constants.Permissions.voiceSpeak.toString()]: `speak`,
    [Constants.Permissions.stream.toString()]: `stream`,
    [Constants.Permissions.useApplicationCommands.toString()]: `use application commands`,
    [Constants.Permissions.useExternalEmojis.toString()]: `use external emojis`,
    [Constants.Permissions.useExternalStickers.toString()]: `use external stickers`,
    // [Constants.Permissions.usePrivateThreads.toString()]: 'use private threads',
    // [Constants.Permissions.usePublicThreads.toString()]: 'use public threads',
    [Constants.Permissions.voiceUseVAD.toString()]: `use voice activity`,
    [Constants.Permissions.viewAuditLog.toString()]: `view the audit log`,
    [Constants.Permissions.viewChannel.toString()]: `view channel`,
    [Constants.Permissions.viewGuildInsights.toString()]: `view insights`,
    [Constants.Permissions.createPrivateThreads.toString()]: `create private threads`,
    [Constants.Permissions.createPublicThreads.toString()]: `create public threads`,
    [Constants.Permissions.sendMessagesInThreads.toString()]: `send messages in threads`,
    [Constants.Permissions.startEmbeddedActivities.toString()]: `start embedded activities`
} as const;
