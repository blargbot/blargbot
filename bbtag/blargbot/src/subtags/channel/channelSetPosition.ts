import { BBTagRuntimeError } from '@bbtag/engine';
import { emptyResultAdapter, Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { PermissionPlugin, PermissionState } from '../../plugins/PermissionPlugin.js';
import { p } from '../p.js';

export class ChannelSetPositionSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelSetPosition',
            aliases: ['channelSetPos']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(PermissionPlugin))
        .parameter(p.plugin(ChannelPlugin))
        .parameter(p.channel({ notFound: 'Channel does not exist' }))
        .parameter(p.int('position'))
        .convertResultUsing(emptyResultAdapter)
    public async setChannelPosition(
        permissions: PermissionPlugin,
        channels: ChannelPlugin,
        channel: Channel,
        position: number
    ): Promise<void> {
        if (!permissions.check(channels.editPermission, channel.id).has(PermissionState.SERVICE_AND_AUTHOR))
            throw new BBTagRuntimeError('Author cannot move this channel');

        //TODO maybe check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?

        const result = await channels.edit(channel.id, { position });
        if (typeof result === 'string')
            throw new BBTagRuntimeError('Failed to move channel: no perms', result);
    }
}
