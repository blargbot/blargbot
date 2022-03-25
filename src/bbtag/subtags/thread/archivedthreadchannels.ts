import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError, InvalidChannelError } from '../../errors';
import { SubtagType } from '../../utils';

export class ArchivedThreadsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'archivedthreadchannels',
            aliases: ['archivedthreads'],
            category: SubtagType.THREAD,
            definition: [
                {
                    parameters: ['channel?'],
                    description: '`channel` defaults to the current channel\n\nLists all archived threads in `channel`.\nReturns an array of thread channel IDs.',
                    exampleCode: '{archivedthreads;123456789123456}',
                    exampleOut: '["123456789012345", "98765432198765"]',
                    returns: 'id[]',
                    execute: (ctx, [channel]) => this.getArchivedThreads(ctx, channel.value)
                }
            ]
        });
    }

    public async getArchivedThreads(context: BBTagContext, channelStr: string): Promise<string[]> {
        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        if (!guard.isThreadableChannel(channel))
            throw new InvalidChannelError(channel.type, channel.id);

        return (await channel.getArchivedThreads('public')).threads.map(t => t.id);
    }
}
