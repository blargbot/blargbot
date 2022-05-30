import { guard } from '@blargbot/core/utils';
import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ArchiveThreadSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'archivethread',
            category: SubtagType.THREAD,
            description: 'Returns `true` if the thread got archived, or `false` if it already was.',
            definition: [
                {
                    parameters: [],
                    description: 'If the current channel is a thread, this will archive the current thread.',
                    exampleCode: '{archivethread}',
                    exampleOut: 'true',
                    execute: (ctx) => this.archiveThread(ctx),
                    returns: 'boolean'
                },
                {
                    parameters: ['threadChannel'],
                    description: '`threadchannel` defaults to the current channel if it\'s a thread\n\n',
                    exampleCode: '{archivethread;111111111111}',
                    exampleOut: 'true',
                    execute: (ctx, args) => this.archiveThread(ctx, args[0].value),
                    returns: 'boolean'
                }
            ]
        });
    }
    public async archiveThread(
        context: BBTagContext,
        threadStr = ''
    ): Promise<boolean> {
        if (threadStr === '' && !guard.isThreadChannel(context.channel))
            throw new BBTagRuntimeError('Not a thread channel');

        const threadChannel = await context.queryThread(threadStr);

        if (threadChannel === undefined)
            throw new ChannelNotFoundError(threadStr);
        if (!context.hasPermission(threadChannel, 'manageThreads') && threadChannel.ownerID !== context.user.id)
            throw new BBTagRuntimeError('Authorizer cannot archive threads');
        if (!threadChannel.permissionsOf(context.discord.user.id).has('manageThreads') && threadChannel.ownerID !== context.user.id)
            throw new BBTagRuntimeError('Bot cannot archive threads');

        if (threadChannel.threadMetadata.archived)
            return false;

        try {
            await context.channel.edit({archived: true}, context.auditReason());
            return true;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to archive thread: ${err.message}`);

        }

    }
}
