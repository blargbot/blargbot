import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, parse, SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import { Permissions } from 'discord.js';

export class ChannelSetPermsSubtag extends BaseSubtag {
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
                    execute: (ctx, [{ value: channel }, { value: type }, { value: item }], subtag) => this.channelDeleteOverwrite(ctx, channel, type.toLowerCase(), item, subtag)
                },
                {
                    parameters: ['channel', 'type', 'memberid|roleid', 'allow', 'deny?'],
                    description: 'Sets the permissions of a `member` or `role` in `channel`\n' +
                        '`type` is either `member` or `role`, and `memberid|roleid` corresponds to the id of the member or role.\n' +
                        'Provide `allow` and `deny` as numbers, which can be calculated [here](https://discordapi.com/permissions.html). ' +
                        'Returns the channel\'s ID.',
                    exampleCode: '{channelsetperms;11111111111111111;member;222222222222222222;1024;2048}',
                    exampleOut: '11111111111111111',
                    execute: (ctx, [channel, type, entityId, allow, deny], subtag) => this.channelSetPerms(ctx, channel.value, type.value, entityId.value, parse.int(allow.value), parse.int(deny.value), subtag)
                }
            ]
        });
    }

    public async channelDeleteOverwrite(
        context: BBTagContext,
        channelStr: string,
        type: string,
        item: string,
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            return this.customError('Channel does not exist', context, subtag); //TODO No channel found error

        if (guard.isThreadChannel(channel))
            return this.customError('Cannot set permissions for a thread channel', context, subtag);

        const permission = channel.permissionsFor(context.authorizer);
        if (permission?.has('MANAGE_CHANNELS') !== true)
            return this.customError('Author cannot edit this channel', context, subtag);

        if (!['member', 'role'].includes(type))
            return this.customError('Type must be member or role', context, subtag);

        //TODO lookup for items, argumentsshould be allowed to be usernames / channelnames
        try {
            const override = channel.permissionOverwrites.cache.get(item);
            if (override !== undefined && override.type === type)
                await override.delete();
            return channel.id;
        } catch (e: unknown) {
            return this.customError('Failed to edit channel: no perms', context, subtag);
        }
    }

    public async channelSetPerms(
        context: BBTagContext,
        channelStr: string,
        typeStr: string,
        entityId: string,
        allow: number,
        deny: number,
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            return this.customError('Channel does not exist', context, subtag); //TODO No channel found error

        if (guard.isThreadChannel(channel))
            return this.customError('Cannot set permissions for a thread channel', context, subtag);

        const permission = channel.permissionsFor(context.authorizer);
        if (permission?.has('MANAGE_CHANNELS') !== true)
            return this.customError('Author cannot edit this channel', context, subtag);

        if (!['member', 'role'].includes(typeStr))
            return this.customError('Type must be member or role', context, subtag);
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
            return this.customError('Failed to edit channel: no perms', context, subtag);
        }
    }
}
