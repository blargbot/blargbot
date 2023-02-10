import type { IJsonConverterType } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GuildSettings extends Readonly<IJsonConverterType<typeof guildSerializer>> {

}

export const guildSerializer = json.object({
    maxAllowedMentions: json.number.nullable,
    actOnLimitsOnly: json.boolean,
    cahNsfw: json.boolean,
    notifyCommandMessageDelete: json.boolean,
    disableEveryone: json.boolean,
    disableNoPerms: json.boolean,
    dmHelp: json.boolean,
    enableChatlogging: json.boolean,
    noCleverBot: json.boolean,
    prefixes: json.array(json.string),
    enableSocialCommands: json.boolean,
    tableFlip: json.boolean,
    language: json.string.nullable,
    staffPerms: json.bigint,
    banOverridePerms: json.bigint.nullable,
    kickOverridePerms: json.bigint.nullable,
    timeoutOverridePerms: json.bigint.nullable,
    greetChannel: json.bigint.nullable,
    farewellChannel: json.bigint.nullable,
    modLogChannel: json.bigint.nullable,
    adminRole: json.bigint.nullable,
    mutedRole: json.bigint.nullable,
    banWarnCount: json.number.nullable,
    kickWarnCount: json.number.nullable,
    timeoutWarnCount: json.number.nullable,
    announceChannel: json.bigint.nullable,
    announceRole: json.bigint.nullable
});
