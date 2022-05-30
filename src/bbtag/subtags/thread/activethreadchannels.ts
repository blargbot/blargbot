import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError, InvalidChannelError } from '../../errors';
import { SubtagType } from '../../utils';

export class ActiveThreadChannelsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'activethreadchannels',
            category: SubtagType.THREAD,
            aliases: ['activethreads'],
            definition: [
                {
                    parameters: [],
                    description: 'Lists all active threads in the current server.',
                    exampleCode: 'This guild has {length;{activethreads}} active threads!',
                    exampleOut: 'This guild has 11 active threads!',
                    returns: 'id[]',
                    execute: async (ctx) => (await ctx.guild.getActiveThreads()).threads.map(t => t.id)
                },
                {
                    parameters: ['channel'],
                    description: '`channel` defaults to the current channel\n\nLists all active threads in `channel`.',
                    exampleCode: 'Channel 12345678912345 has {length;{activethreads;12345678912345}} active threads!',
                    exampleOut: 'Channel 12345678912345 has 5 active threads!',
                    returns: 'id[]',
                    execute: (ctx, [channel]) => this.listActiveThreadChannels(ctx, channel.value)
                }
            ]
        });
    }

    public async listActiveThreadChannels(context: BBTagContext, channelStr: string): Promise<string[]> {
        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        if (!guard.isThreadableChannel(channel))
            throw new InvalidChannelError(channel.type, channel.id);

        const activeThreads = await channel.guild.getActiveThreads();
        return activeThreads.threads.filter(t => t.parentID === channel.id).map(t => t.id);
    }
}
