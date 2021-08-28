import { BaseSubtag } from '@cluster/bbtag';
import { discordUtil, guard, SubtagType } from '@cluster/utils';

export class ArchivedThreadsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'archivedthreads',
            category: SubtagType.THREAD,
            definition: [
                {
                    parameters: ['channel?'],
                    description: '`channel` defaults to the current channel\n\nLists all archived threads in `channel`.\nReturns an array of thread channel IDs.',
                    exampleCode: '{archivedthreads;123456789123456}',
                    exampleOut: '["123456789012345", "98765432198765"]',
                    execute: async (context, args, subtag) => {
                        const channel = await context.queryChannel(args[0].value);
                        if (channel === undefined)
                            return this.channelNotFound(context, subtag);
                        if (guard.isThreadableChannel(channel))
                            return JSON.stringify((await channel.threads.fetchArchived()).threads.map(t => t.id));
                        return this.customError(discordUtil.notThreadable(channel), context, subtag);
                    }
                }
            ]
        });
    }
}
