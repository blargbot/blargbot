import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient } from '@blargbot/api-client';

import { guildSettingsSerializer, guildSettingsUpdateSerializer } from './serializer.js';

export * from './serializer.js';

export interface GuildSettings {
    readonly maxAllowedMentions: number | null;
    readonly actOnLimitsOnly: boolean;
    readonly cahNsfw: boolean;
    readonly notifyCommandMessageDelete: boolean;
    readonly disableEveryone: boolean;
    readonly disableNoPerms: boolean;
    readonly dmHelp: boolean;
    readonly enableChatLogging: boolean;
    readonly noCleverBot: boolean;
    readonly prefixes: readonly string[];
    readonly enableSocialCommands: boolean;
    readonly tableFlip: boolean;
    readonly language: string | null;
    readonly staffPerms: bigint;
    readonly banOverridePerms: bigint | null;
    readonly kickOverridePerms: bigint | null;
    readonly timeoutOverridePerms: bigint | null;
    readonly greetChannel: bigint | null;
    readonly farewellChannel: bigint | null;
    readonly modLogChannel: bigint | null;
    readonly adminRole: bigint | null;
    readonly mutedRole: bigint | null;
    readonly banWarnCount: number | null;
    readonly kickWarnCount: number | null;
    readonly timeoutWarnCount: number | null;
    readonly announceChannel: bigint | null;
    readonly announceRole: bigint | null;
}

export type GuildSettingsUpdateBody = Partial<GuildSettings>

export interface GuildSettingsParameters {
    readonly guildId: string | bigint;
}

export interface GuildSettingsUpdateRequest extends GuildSettingsUpdateBody, GuildSettingsParameters {

}

export class GuildSettingsHttpClient extends defineApiClient({
    getSettings: b => b.route<GuildSettingsParameters>(x => `${x.guildId}`)
        .response<GuildSettings>(200, guildSettingsSerializer.fromBlob),
    updateSettings: b => b.route<GuildSettingsUpdateRequest>('PATCH', x => `${x.guildId}`)
        .body(guildSettingsUpdateSerializer.toBlob)
        .response(204),
    resetSettings: b => b.route<GuildSettingsParameters>('DELETE', x => `${x.guildId}`)
        .response(204)
}) {

    public static from(options: GuildSettingsHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): GuildSettingsHttpClient {
        if (options instanceof GuildSettingsHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new GuildSettingsHttpClient(options);
    }
}
