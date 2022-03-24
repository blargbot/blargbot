import { guard, parse } from '@blargbot/core/utils';
import { ApiError, Constants, DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelSetPermsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelsetperms',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'type', 'memberid|roleid'], //TODO allow member/role names
                    description: 'Deletes the permission overwrites of `memberid|roleid` in `channel`.\n' +
                        'Returns the channel\'s ID.',
                    exampleCode: '{channelsetperms;11111111111111111;member;222222222222222222}',
                    exampleOut: '11111111111111111',
                    returns: 'id',
                    execute: (ctx, [channel, type, item]) => this.channelSetPerms(ctx, channel.value, type.value, item.value, undefined, undefined)
                },
                {
                    parameters: ['channel', 'type', 'memberid|roleid', 'allow', 'deny?'],
                    description: 'Sets the permissions of a `member` or `role` in `channel`\n' +
                        '`type` is either `member` or `role`, and `memberid|roleid` corresponds to the id of the member or role.\n' +
                        'Provide `allow` and `deny` as numbers, which can be calculated [here](https://discordapi.com/permissions.html). ' +
                        'Returns the channel\'s ID.',
                    exampleCode: '{channelsetperms;11111111111111111;member;222222222222222222;1024;2048}',
                    exampleOut: '11111111111111111',
                    returns: 'id',
                    execute: (ctx, [channel, type, entityId, allow, deny]) => this.channelSetPerms(ctx, channel.value, type.value, entityId.value, parse.bigInt(allow.value), parse.bigInt(deny.value))
                }
            ]
        });
    }

    public async channelSetPerms(
        context: BBTagContext,
        channelStr: string,
        typeStr: string,
        entityId: string,
        allow = 0n,
        deny = 0n
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist'); //TODO No channel found error

        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');

        if (!context.hasPermission(channel, 'manageChannels'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        if (!context.hasPermission(channel, allow | deny))
            throw new BBTagRuntimeError('Author missing requested permissions');

        const type = this.getOverwriteType(typeStr);
        try {
            if (allow !== 0n || deny !== 0n)
                await channel.editPermission(entityId, allow, deny, type, context.auditReason());
            else
                await channel.deletePermission(entityId, context.auditReason());

            return channel.id;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to edit channel: ${err.code === ApiError.MISSING_PERMISSIONS ? 'no perms' : err.message}`);
        }
    }

    private getOverwriteType(typeStr: string): Constants['PermissionOverwriteTypes'][keyof Constants['PermissionOverwriteTypes']] {

        switch (typeStr) {
            case 'member': return Constants.PermissionOverwriteTypes.USER;
            case 'role': return Constants.PermissionOverwriteTypes.ROLE;
            default: throw new BBTagRuntimeError('Type must be member or role');
        }
    }
}
