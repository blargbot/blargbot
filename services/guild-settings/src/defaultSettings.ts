import type { GuildSettings } from './GuildSettings.js';

export const defaultSettings = (): GuildSettings => ({
    actOnLimitsOnly: false,
    cahNsfw: false,
    disableEveryone: false,
    disableNoPerms: false,
    dmHelp: false,
    enableChatlogging: false,
    enableSocialCommands: false,
    noCleverBot: false,
    notifyCommandMessageDelete: false,
    prefixes: [],
    staffPerms: 8254n,
    tableFlip: true,
    adminRole: null,
    banOverridePerms: null,
    banWarnCount: null,
    farewellChannel: null,
    greetChannel: null,
    kickOverridePerms: null,
    kickWarnCount: null,
    language: null,
    maxAllowedMentions: null,
    modLogChannel: null,
    mutedRole: null,
    timeoutOverridePerms: null,
    timeoutWarnCount: null,
    announceChannel: null,
    announceRole: null
});
