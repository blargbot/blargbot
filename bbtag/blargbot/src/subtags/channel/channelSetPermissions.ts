import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin, OverrideType } from '../../plugins/ChannelPlugin.js';
import { PermissionPlugin, PermissionState } from '../../plugins/PermissionPlugin.js';
import { p } from '../p.js';
import { threadChannels } from './channelIsThread.js';

export class ChannelSetPermissionsSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelSetPermissions',
            aliases: ['channelSetPerms']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(PermissionPlugin))
        .parameter(p.plugin(ChannelPlugin))
        .parameter(p.channel({ notFound: 'Channel does not exist' }))
        .parameter(p.oneOf('type', [OverrideType.MEMBER, OverrideType.ROLE], 'Type must be member or role'))
        .parameter(p.string('entityId'))
        .parameter(p.bigint('allow').optional(0n))
        .parameter(p.bigint('deny').optional(0n))
    public async channelSetPerms(
        permissions: PermissionPlugin,
        channels: ChannelPlugin,
        channel: Channel,
        type: OverrideType,
        entityId: string,
        allow: bigint,
        deny: bigint
    ): Promise<string> {
        if (threadChannels.has(channel.type))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');

        if (!permissions.check(channels.editPermission, channel.id).has(PermissionState.SERVICE_AND_AUTHOR))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        if (!permissions.check(allow | deny, channel.id).has(PermissionState.SERVICE_AND_AUTHOR))
            throw new BBTagRuntimeError('Author missing requested permissions');

        const result = await channels.editOverride(channel.id, type, entityId, allow, deny);
        if (typeof result === 'string')
            throw new BBTagRuntimeError('Failed to edit channel: no perms', result);

        return channel.id;
    }
}
