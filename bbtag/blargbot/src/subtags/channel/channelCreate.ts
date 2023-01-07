import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';
import { mapping } from '@blargbot/mapping';

import type { ChannelCreateOptions } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin, ChannelType, OverrideType } from '../../plugins/ChannelPlugin.js';
import { PermissionPlugin, PermissionState } from '../../plugins/PermissionPlugin.js';
import { p } from '../p.js';

export class ChannelCreateSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelCreate'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(PermissionPlugin))
        .parameter(p.plugin(ChannelPlugin))
        .parameter(p.string('name'))
        .parameter(p.string('type').optional('text'))
        .parameter(p.json('options', mapOptions).optional({}))
    public async channelCreate(
        permissions: PermissionPlugin,
        channels: ChannelPlugin,
        name: string,
        typeKey: string,
        options: ChannelCreateOptions
    ): Promise<string> {
        if (permissions.check(channels.createPermission).has(PermissionState.SERVICE_AND_AUTHOR))
            throw new BBTagRuntimeError('Author cannot create channels');

        const type = typeKey in channelTypes ? channelTypes[typeKey as keyof typeof channelTypes] : channelTypes.text;
        for (const permission of options.permissionOverwrites ?? [])
            if (permissions.check(permission.allow | permission.deny).has(PermissionState.SERVICE_AND_AUTHOR))
                throw new BBTagRuntimeError('Author missing requested permissions');

        const channel = await channels.create(name, type, options);
        if (typeof channel === 'string')
            throw new BBTagRuntimeError('Failed to create channel: no perms', channel);

        return channel.id;
    }
}

const channelTypes = {
    text: ChannelType.TEXT,
    voice: ChannelType.VOICE,
    category: ChannelType.CATEGORY,
    news: ChannelType.NEWS
} as const;

const mapOptions = mapping.json(
    mapping.object<ChannelCreateOptions>({
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
                type: mapping.in(OverrideType.ROLE, OverrideType.MEMBER)
            })
        ).optional,
        reason: mapping.string.optional
    })
);
