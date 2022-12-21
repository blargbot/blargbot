import { guard } from '@blargbot/core/utils/index.js';
import { mapping } from '@blargbot/mapping';
import * as Eris from 'eris';

import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class ChannelCreateSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelCreate',
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
    }

    public async channelCreate(
        context: BBTagContext,
        name: string,
        typeKey: string,
        optionsJson: string
    ): Promise<string> {
        if (!context.hasPermission('manageChannels'))
            throw new BBTagRuntimeError('Author cannot create channels');

        const mapped = mapOptions(optionsJson);
        if (!mapped.valid)
            throw new BBTagRuntimeError('Invalid JSON');
        const options = mapped.value;

        const type = guard.hasProperty(channelTypes, typeKey) ? channelTypes[typeKey] : Eris.Constants.ChannelTypes.GUILD_TEXT;

        for (const permission of options.permissionOverwrites ?? [])
            if (!context.hasPermission((permission.allow as bigint) | (permission.deny as bigint)))
                throw new BBTagRuntimeError('Author missing requested permissions');

        try {
            options.reason ||= context.auditReason();
            const channel = await context.guild.createChannel(name, type, options);
            return channel.id;
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to create channel: no perms', err.message);
        }
    }
}

const channelTypes = {
    text: Eris.Constants.ChannelTypes.GUILD_TEXT,
    voice: Eris.Constants.ChannelTypes.GUILD_VOICE,
    category: Eris.Constants.ChannelTypes.GUILD_CATEGORY,
    news: Eris.Constants.ChannelTypes.GUILD_NEWS,
    store: Eris.Constants.ChannelTypes.GUILD_STORE
} as const;

const mapOptions = mapping.json(
    mapping.object<Eris.CreateChannelOptions>({
        bitrate: mapping.number.optional,
        nsfw: mapping.boolean.optional,
        parentID: mapping.string.optional,
        rateLimitPerUser: mapping.number.optional,
        topic: mapping.string.optional,
        userLimit: mapping.number.optional,
        permissionOverwrites: mapping.array(
            mapping.object({
                allow: mapping.bigInt.optional.map(v => v ?? 0n),
                deny: mapping.bigInt.optional.map(v => v ?? 0n),
                id: mapping.string,
                type: mapping.in('role', 'member')
                    .map(v => v === 'member' ? 'user' : v)
                    .map(v => Eris.Constants.PermissionOverwriteTypes[v.toUpperCase()])
            })
        ).optional,
        reason: mapping.string.optional,
        position: [undefined]
    })
);
