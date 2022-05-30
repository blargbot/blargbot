import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ThreadMembersSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'threadmembers',
            category: SubtagType.THREAD,
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of member IDs if the current channel is a thread.',
                    exampleCode: '{threadmembers}',
                    exampleOut: '["1111111111111", "2222222222222"]',
                    execute: (ctx) => this.getCurrentThreadMembers(ctx),
                    returns: 'id[]'
                },
                {
                    parameters: ['threadChannel'],
                    description: 'Returns an array of member IDs in `threadchannel`',
                    exampleCode: '{threadmembers;11111111111111}',
                    exampleOut: '["2222222222222222", "3333333333333333"]',
                    execute: (ctx, args) => this.getThreadMembers(ctx, args[0].value),
                    returns: 'id[]'
                }
            ]
        });
    }

    public async getCurrentThreadMembers(
        context: BBTagContext
    ): Promise<string[]> {
        if (!guard.isThreadChannel(context.channel))
            throw new BBTagRuntimeError('Not a thread channel');
        const members = await context.channel.getMembers();

        return members.map(m => m.id);
    }

    public async getThreadMembers(
        context: BBTagContext,
        threadStr: string
    ): Promise<string[]> {
        const threadChannel = await context.queryThread(threadStr, {
            noErrors: context.scopes.local.noLookupErrors, noLookup: context.scopes.local.quiet
        });
        if (threadChannel === undefined)
            throw new ChannelNotFoundError(threadStr);

        const members = await threadChannel.getMembers();

        return members.map(m => m.id);
    }
}
