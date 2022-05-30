import { guard } from '@blargbot/core/utils';
import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class UnarchiveThreadSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'unarchivethread',
            category: SubtagType.THREAD,
            description: 'Returns `true` if the thread got unarchived, or `false` if it already was.',
            definition: [
                {
                    parameters: ['threadChannelID'],
                    description: '`threadChannelID` defaults to the current thread if empty\n\nUnarchives thread with ID `threadChannelID`',
                    exampleCode: '{unarchivethread;111111111111}',
                    exampleOut: 'true',
                    execute: (ctx, args) => this.unarchiveThread(ctx, args[0].value),
                    returns: 'boolean'
                }
            ]
        });
    }

    public async unarchiveThread(
        context: BBTagContext,
        threadStr: string
    ): Promise<boolean> {
        if (threadStr === '' && !guard.isThreadChannel(context.channel))
            throw new BBTagRuntimeError('Not a thread channel');
        const threadChannel = await context.queryThread(threadStr);
        if (threadChannel === undefined)
            throw new ChannelNotFoundError(threadStr);

        if (!context.hasPermission(threadChannel, 'manageThreads') && threadChannel.threadMetadata.locked)
            throw new BBTagRuntimeError('Authorizer cannot unarchive threads');
        if (!threadChannel.permissionsOf(context.discord.user.id).has('manageThreads') && threadChannel.threadMetadata.locked)
            throw new BBTagRuntimeError('Bot cannot unarchive threads');
        if (!threadChannel.threadMetadata.archived)
            return false;

        try {
            await threadChannel.edit({archived: false}, context.auditReason());
            return true;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to archive thread: ${err.message}`);
        }
    }
}
