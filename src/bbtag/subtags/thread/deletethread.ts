import { guard } from '@blargbot/core/utils';
import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class DeleteThreadSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'deletethread',
            category: SubtagType.THREAD,
            aliases: ['threadelete', 'threaddelete'],
            definition: [
                {
                    parameters: ['threadChannel?'],
                    description: '`threadChannel` defaults to the current channel.\n\nDeletes `threadChannel` and returns `true` if successful.',
                    exampleCode: '{deletethread}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel]) => this.deleteThread(ctx, channel.value)
                }
            ]
        });
    }

    public async deleteThread(
        context: BBTagContext,
        threadStr: string
    ): Promise<boolean> {
        const threadChannel = await context.queryThread(threadStr);

        if (threadChannel === undefined)
            throw new ChannelNotFoundError(threadStr);
        if (!guard.isThreadChannel(threadChannel))
            throw new BBTagRuntimeError('Not a thread channel');
        if (!context.hasPermission(threadChannel, 'manageThreads'))
            throw new BBTagRuntimeError('Authorizer cannot delete threads');
        if (!threadChannel.permissionsOf(context.discord.user.id).has('manageThreads'))
            throw new BBTagRuntimeError('Bot cannot delete threads');
        try {
            await threadChannel.delete(context.auditReason());
            return true;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to delete thread: ${err.message}`);
        }
    }

}
