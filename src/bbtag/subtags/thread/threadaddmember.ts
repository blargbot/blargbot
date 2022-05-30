import { ApiError, DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError, UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ThreadAddMemberSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'threadaddmember',
            category: SubtagType.THREAD,
            aliases: ['threadadd'],
            description: '`threadChannel` defaults to the current channel.\n`member` defaults to the executing user.',
            definition: [
                {
                    parameters: ['threadChannel?'],
                    description: 'Adds the current user to `threadChannel`',
                    exampleCode: '{threadaddmember}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel]) => this.addThreadMember(ctx, channel.value, ctx.member.id)
                },
                {
                    parameters: ['threadChannel', 'member'],
                    description: 'Adds `member` to `threadChannel`',
                    exampleCode: '{threadaddmember;;stupid cat}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel, member]) => this.addThreadMember(ctx, channel.value, member.value)
                }
            ]
        });
    }

    public async addThreadMember(
        context: BBTagContext,
        threadStr: string,
        memberStr: string
    ) : Promise<boolean> {
        const threadChannel = await context.queryThread(threadStr);
        if (threadChannel === undefined)
            throw new ChannelNotFoundError(threadStr);
        if (!context.hasPermission(threadChannel, 'sendMessagesInThreads'))
            throw new BBTagRuntimeError('Authorizer cannot add members to threads');
        if (!threadChannel.permissionsOf(context.discord.user.id).has('sendMessagesInThreads'))
            throw new BBTagRuntimeError('Bot cannot add members to threads');

        const member = await context.queryMember(memberStr);
        if (member === undefined)
            throw new UserNotFoundError(memberStr);

        const members = await threadChannel.getMembers();
        if (members.find(m => m.id === member.id) !== undefined)
            return false;
        try {
            await threadChannel.join(member.id);
            return true;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to add thread member: ${err.code === ApiError.MISSING_PERMISSIONS ? 'no perms' : err.message}`);
        }
    }
}
