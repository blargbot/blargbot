import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, parse, SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import { Permissions } from 'discord.js';

export class ChannelSetPermsSubtag extends Subtag {
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
                    execute: (ctx, [{ value: channel }, { value: type }, { value: item }]) => this.channelDeleteOverwrite(ctx, channel, type.toLowerCase(), item)
                },
                {
                    parameters: ['channel', 'type', 'memberid|roleid', 'allow', 'deny?'],
                    description: 'Sets the permissions of a `member` or `role` in `channel`\n' +
                        '`type` is either `member` or `role`, and `memberid|roleid` corresponds to the id of the member or role.\n' +
                        'Provide `allow` and `deny` as numbers, which can be calculated [here](https://discordapi.com/permissions.html). ' +
                        'Returns the channel\'s ID.',
                    exampleCode: '{channelsetperms;11111111111111111;member;222222222222222222;1024;2048}',
                    exampleOut: '11111111111111111',
                    execute: (ctx, [channel, type, entityId, allow, deny]) => this.channelSetPerms(ctx, channel.value, type.value, entityId.value, parse.int(allow.value), parse.int(deny.value))
                }
            ]
        });
    }

    public async channelDeleteOverwrite(
        context: BBTagContext,
        channelStr: string,
        type: string,
        item: string
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist'); //TODO No channel found error

        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');

        const permission = channel.permissionsFor(context.authorizer);
        if (permission?.has('MANAGE_CHANNELS') !== true)
            throw new BBTagRuntimeError('Author cannot edit this channel');

        if (!['member', 'role'].includes(type))
            throw new BBTagRuntimeError('Type must be member or role');

        //TODO lookup for items, argumentsshould be allowed to be usernames / channelnames
        try {
            const override = channel.permissionOverwrites.cache.get(item);
            if (override !== undefined && override.type === type)
                await override.delete();
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
        allow: number,
        deny: number
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist'); //TODO No channel found error

        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');

        const permission = channel.permissionsFor(context.authorizer);
        if (permission?.has('MANAGE_CHANNELS') !== true)
            throw new BBTagRuntimeError('Author cannot edit this channel');

        if (!['member', 'role'].includes(typeStr))
            throw new BBTagRuntimeError('Type must be member or role');
        const type: 'member' | 'role' = typeStr as 'member' | 'role';

        try {
            const fullReason = discordUtil.formatAuditReason(
                context.user,
                context.scopes.local.reason ?? ''
            );
            const overwrite = channel.permissionOverwrites.cache.get(entityId);
            if (overwrite !== undefined && overwrite.type === type) {
                if (isNaN(allow) && isNaN(deny)) {
                    await overwrite.edit({});//* Feel like this shouldn't be here but backwards compatibility
                } else {
                    const allowed = new Permissions(BigInt(isNaN(allow) ? 0 : Math.floor(allow))).toArray();
                    const denied = new Permissions(BigInt(isNaN(deny) ? 0 : Math.floor(deny))).toArray();
                    await overwrite.edit(
                        Object.fromEntries([
                            ...Object.keys(Permissions.FLAGS).map(k => [k, null] as const),
                            ...allowed.map(str => [str, true] as const),
                            ...denied.map(str => [str, false] as const)
                        ]),
                        fullReason
                    );
                }
            }
            return channel.id;
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to edit channel: no perms');
        }
    }
}
