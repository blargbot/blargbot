import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, parse, SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import { Constants } from 'eris';

export class ChannelSetPermsSubtag extends DefinedSubtag {
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
                    execute: (ctx, [channel, type, item]) => this.channelDeleteOverwrite(ctx, channel.value, type.value.toLowerCase(), item.value)
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

    public async channelDeleteOverwrite(
        context: BBTagContext,
        channelStr: string,
        typeStr: string,
        item: string
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist'); //TODO No channel found error

        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');

        const permission = channel.permissionsOf(context.authorizer);
        if (permission.has('manageChannels') !== true)
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const type = this.getOverwriteType(typeStr);

        //TODO lookup for items, argumentsshould be allowed to be usernames / channelnames
        try {
            const override = channel.permissionOverwrites.get(item);
            if (override !== undefined && override.type === type)
                await channel.deletePermission(override.id);
            return channel.id;
        } catch (e: unknown) {
            throw new BBTagRuntimeError('Failed to edit channel: no perms');
        }
    }

    public async channelSetPerms(
        context: BBTagContext,
        channelStr: string,
        typeStr: string,
        entityId: string,
        allow: bigint | undefined,
        deny: bigint | undefined
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist'); //TODO No channel found error

        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');

        const permission = channel.permissionsOf(context.authorizer);
        if (permission.has('manageChannels') !== true)
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const type = this.getOverwriteType(typeStr);
        try {
            const fullReason = discordUtil.formatAuditReason(
                context.user,
                context.scopes.local.reason ?? ''
            );
            const overwrite = channel.permissionOverwrites.get(entityId);
            if (overwrite !== undefined && overwrite.type === type) {
                if (allow === undefined && deny === undefined) {
                    // NOOP
                } else {
                    await channel.editPermission(overwrite.id, allow ?? 0n, deny ?? 0n, type, fullReason);
                }
            }
            return channel.id;
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to edit channel: no perms');
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
