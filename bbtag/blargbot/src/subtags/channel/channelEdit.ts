import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';
import { mapping } from '@blargbot/mapping';

import type { ChannelEditOptions, ThreadEditOptions } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin, ChannelType } from '../../plugins/ChannelPlugin.js';
import { PermissionPlugin, PermissionState } from '../../plugins/PermissionPlugin.js';
import { p } from '../p.js';

export class ChannelEditSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelEdit'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(PermissionPlugin))
        .parameter(p.plugin(ChannelPlugin))
        .parameter(p.string('channel'))
        .parameter(p.json('options', mapEditOptions).optional({}))
    public async channelEdit(
        permissions: PermissionPlugin,
        channels: ChannelPlugin,
        channelQuery: string,
        options: ChannelEditOptions | ThreadEditOptions
    ): Promise<string> {
        const channel = await channels.query(channelQuery, {});
        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');//TODO no channel found error

        if (!permissions.check(channels.editPermission, channel.id).has(PermissionState.SERVICE_AND_AUTHOR))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const mapping = threadTypes.has(channel.type) ? mapThreadOptions : mapChannelOptions;
        const mapped = mapping(options); // validate options, just to be sure they match the found channel
        if (!mapped.valid)
            throw new BBTagRuntimeError('Invalid JSON');

        const result = await channels.edit(channel.id, mapped.value);
        if (typeof result === 'string')
            throw new BBTagRuntimeError('Failed to edit channel: no perms', result);

        return channel.id;
    }
}

const threadTypes = new Set([ChannelType.THREAD_NEWS, ChannelType.THREAD_PRIVATE, ChannelType.THREAD_PUBLIC] as const);

const defaultAutoArchiveDurationMapping = mapping.in(...[60, 1440, 4320, 10080, undefined] as const);

const mapChannelOptions = mapping.object<ChannelEditOptions>({
    bitrate: mapping.number.optional,
    name: mapping.string.optional,
    nsfw: mapping.boolean.optional,
    parentID: mapping.string.optional,
    rateLimitPerUser: mapping.number.optional,
    topic: mapping.string.optional,
    userLimit: mapping.number.optional,
    defaultAutoArchiveDuration: mapping.number.chain(defaultAutoArchiveDurationMapping).optional,
    locked: mapping.boolean.optional,
    position: [undefined]
});

const mapThreadOptions = mapping.object<ThreadEditOptions>({
    archived: mapping.boolean.optional,
    autoArchiveDuration: mapping.number.chain(defaultAutoArchiveDurationMapping).optional,
    locked: mapping.boolean.optional,
    name: mapping.string.optional,
    rateLimitPerUser: mapping.number.optional,
    invitable: mapping.boolean.optional
});

const mapEditOptions = mapping.json(mapping.choice(mapChannelOptions, mapThreadOptions));
