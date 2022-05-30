import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ThreadOwnerIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'threadownerid',
            category: SubtagType.THREAD,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the owner of the current thread.',
                    exampleCode: '{threadownerid}',
                    exampleOut: '111111111111111',
                    execute: (ctx) => this.getCurrentThreadOwner(ctx),
                    returns: 'id'
                },
                {
                    parameters: ['threadChannel'],
                    description: 'Returns the owner of `threadchannel`.',
                    exampleCode: '{threadownerid;11111111111111}',
                    exampleOut: '22222222222222',
                    execute: (ctx, args) => this.getThreadOwner(ctx, args[0].value),
                    returns: 'id'
                }
            ]
        });
    }

    public getCurrentThreadOwner(
        context: BBTagContext
    ): string {
        if (!guard.isThreadChannel(context.channel))
            throw new BBTagRuntimeError('Not a thread channel');
        return context.channel.ownerID;
    }

    public async getThreadOwner(
        context: BBTagContext,
        threadStr: string
    ): Promise<string> {
        const threadChannel = await context.queryThread(threadStr, {
            noErrors: context.scopes.local.noLookupErrors, noLookup: context.scopes.local.quiet
        });
        if (threadChannel === undefined)
            throw new ChannelNotFoundError(threadStr);

        return threadChannel.ownerID;
    }
}
