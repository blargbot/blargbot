import { Constants, DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError, UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ThreadRemoveMemberSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'threadremovemember',
            category: SubtagType.THREAD,
            aliases: ['threadremove'],
            description: '`threadChannel` defaults to the current channel.\n`member` defaults to the executing user.',
            definition: [
                {
                    parameters: ['threadChannel?'],
                    description: 'Removes the current user from `threadChannel`',
                    exampleCode: '{threadremovemember}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel]) => this.removeThreadMember(ctx, channel.value, ctx.member.id)
                },
                {
                    parameters: ['threadChannel', 'member'],
                    description: 'Removes `member` from `threadChannel`',
                    exampleCode: '{threadremovemember;;stupid cat}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel, member]) => this.removeThreadMember(ctx, channel.value, member.value)
                }
            ]
        });
    }

    public async removeThreadMember(
        context: BBTagContext,
        threadStr: string,
        memberStr: string
    ) : Promise<boolean> {
        const threadChannel = await context.queryThread(threadStr);
        if (threadChannel === undefined)
            throw new ChannelNotFoundError(threadStr);

        const userOwnsPrivateThread = threadChannel.type === Constants.ChannelTypes.GUILD_PRIVATE_THREAD && context.authorizerId === threadChannel.ownerID;
        const botOwnsPrivateThread = threadChannel.type === Constants.ChannelTypes.GUILD_PRIVATE_THREAD && context.discord.user.id === threadChannel.ownerID;
        if (!context.hasPermission(threadChannel, 'manageThreads') && !userOwnsPrivateThread)
            throw new BBTagRuntimeError('Authorizer cannot remove members from threads');
        if (!threadChannel.permissionsOf(context.discord.user.id).has('manageThreads') && !botOwnsPrivateThread)
            throw new BBTagRuntimeError('Bot cannot remove members from threads');

        const member = await context.queryMember(memberStr);
        if (member === undefined)
            throw new UserNotFoundError(memberStr);
        const members = await threadChannel.getMembers();
        if (members.find(m => member.id === m.id) === undefined)
            return false;
        try {
            await threadChannel.leave(member.id);
            return true;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to remove thread member: ${err.message}`);
        }
    }
}
