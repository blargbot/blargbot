import { BaseSubtag } from '@cluster/bbtag';
import { ChannelNotFoundError } from '@cluster/bbtag/errors';
import { discordUtil, guard, SubtagType } from '@cluster/utils';

export class ThreadChannelsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'threadchannels',
            category: SubtagType.THREAD,
            aliases: ['threads'],
            definition: [
                {
                    parameters: ['channel?'],
                    description: 'Lists all active threads in the current server. If `channel` is provided, lists all active threads in `channel`',
                    exampleCode: 'This guild has {length;{threads}} active threads!',
                    exampleOut: 'This guild has 11 active threads!',
                    execute: async (ctx, [channelStr]) => {
                        if (channelStr.value === '')
                            return JSON.stringify((await ctx.guild.channels.fetchActiveThreads()).threads.map(t => t.id));
                        const channel = await ctx.queryChannel(channelStr.value);
                        if (channel === undefined)
                            throw new ChannelNotFoundError(channelStr.value);
                        if (guard.isThreadableChannel(channel))
                            return JSON.stringify((await channel.threads.fetchActive()).threads.map(t => t.id));
                        return discordUtil.notThreadable(channel);
                    }
                }
            ]
        });
    }
}
