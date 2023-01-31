import { hasFlag, hasProperty } from '@blargbot/guards';
import { mapping } from '@blargbot/mapping';
import { ChannelType, OverwriteType } from 'discord-api-types/v10';
import * as Discord from 'discord-api-types/v10';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { Entities } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.channelCreate;

@Subtag.names('channelCreate')
@Subtag.ctorArgs(Subtag.service('channel'))
export class ChannelCreateSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;

    public constructor(channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
            description: tag.description,
            definition: [
                {
                    parameters: ['name', 'type?:text', 'options?:{}'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx, [name, type, options]) => this.channelCreate(ctx, name.value, type.value, options.value)
                }
            ]
        });

        this.#channels = channels;
    }

    public async channelCreate(
        context: BBTagContext,
        name: string,
        typeKey: string,
        optionsJson: string
    ): Promise<string> {
        const permission = context.getPermission(context.authorizer);
        if (!hasFlag(permission, Discord.PermissionFlagsBits.ManageChannels))
            throw new BBTagRuntimeError('Author cannot create channels');

        const mapped = mapOptions(optionsJson);
        if (!mapped.valid)
            throw new BBTagRuntimeError('Invalid JSON');
        const { reason, ...options } = mapped.value;

        const type = hasProperty(channelTypes, typeKey) ? channelTypes[typeKey] : ChannelType.GuildText;

        for (const permission of options.permissionOverwrites ?? [])
            if (!hasFlag(context.getPermission(context.authorizer), BigInt(permission.allow) | BigInt(permission.deny)))
                throw new BBTagRuntimeError('Author missing requested permissions');

        const result = await this.#channels.create(context, { ...options, name, type }, reason);

        if (!('error' in result))
            return result.id;

        throw new BBTagRuntimeError('Failed to create channel: no perms', result.error);
    }
}

const channelTypes: Record<string, Entities.Channel['type']> = {
    text: ChannelType.GuildText,
    voice: ChannelType.GuildVoice,
    category: ChannelType.GuildCategory,
    news: ChannelType.GuildAnnouncement
} as const;

const mapOptions = mapping.json(
    mapping.object<Omit<Entities.CreateChannel, 'name' | 'type'> & { reason?: string; }>({
        bitrate: mapping.number.optional,
        nsfw: mapping.boolean.optional,
        parentID: mapping.string.optional,
        rateLimitPerUser: mapping.number.optional,
        topic: mapping.string.optional,
        userLimit: mapping.number.optional,
        permissionOverwrites: mapping.array(
            mapping.object({
                allow: mapping.bigInt.optional.map(v => (v ?? 0n).toString()),
                deny: mapping.bigInt.optional.map(v => (v ?? 0n).toString()),
                id: mapping.string,
                type: mapping.in('role', 'member')
                    .map(v => v === 'member' ? OverwriteType.Member : OverwriteType.Role)
            })
        ).optional,
        reason: mapping.string.optional,
        position: [undefined]
    })
);
