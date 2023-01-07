import { BBTagRuntimeError } from '@bbtag/engine';
import { emptyResultAdapter, Subtag } from '@bbtag/subtag';

import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { PermissionPlugin, PermissionState } from '../../plugins/PermissionPlugin.js';
import { p } from '../p.js';

export class ChannelDeleteSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelDelete'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(PermissionPlugin))
        .parameter(p.plugin(ChannelPlugin))
        .parameter(p.string('channel'))
        .convertResultUsing(emptyResultAdapter)
    public async deleteChannel(
        permissions: PermissionPlugin,
        channels: ChannelPlugin,
        channelQuery: string
    ): Promise<void> {
        const channel = await channels.query(channelQuery, {});

        /**
         * TODO change this to "No channel found" for consistency
         * * when versioning is out and about
         */
        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');

        if (!permissions.check(channels.deletePermission, channel.id).has(PermissionState.SERVICE_AND_AUTHOR))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const result = await channels.delete(channel.id, {});
        if (typeof result === 'string')
            throw new BBTagRuntimeError('Failed to edit channel: no perms', result);
    }
}
