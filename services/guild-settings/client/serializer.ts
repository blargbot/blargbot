import type { IJsonConverter } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';

import type { GuildSettings } from './index.js';

export const guildSettingsSerializerOptions = {
    maxAllowedMentions: json.number.nullable,
    actOnLimitsOnly: json.boolean,
    cahNsfw: json.boolean,
    notifyCommandMessageDelete: json.boolean,
    disableEveryone: json.boolean,
    disableNoPerms: json.boolean,
    dmHelp: json.boolean,
    enableChatLogging: json.boolean,
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
};

export const guildSettingsUpdateSerializerOptions = Object.fromEntries(
    Object.entries(guildSettingsSerializerOptions)
        .map(x => [x[0], x[1].optional] as const)
) as {
        [P in keyof typeof guildSettingsSerializerOptions]: typeof guildSettingsSerializerOptions[P] extends IJsonConverter<infer R>
        ? IJsonConverter<R | undefined>
        : never
    };

export const guildSettingsSerializer = json.object<GuildSettings>(guildSettingsSerializerOptions);

export const guildSettingsUpdateSerializer = json.object<Partial<GuildSettings>>(guildSettingsUpdateSerializerOptions);
