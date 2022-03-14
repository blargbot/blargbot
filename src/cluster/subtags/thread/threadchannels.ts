import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { ChannelNotFoundError, InvalidChannelError } from '@cluster/bbtag/errors';
import { guard, SubtagType } from '@cluster/utils';

export class ThreadChannelsSubtag extends DefinedSubtag {
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
                    returns: 'id[]',
                    execute: (ctx, [channel]) => this.listThreadChannels(ctx, channel.value)
                }
            ]
        });
    }

    public async listThreadChannels(context: BBTagContext, channelStr: string): Promise<string[]> {
        if (channelStr === '')
            return (await context.guild.getActiveThreads()).threads.map(t => t.id);

        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        if (!guard.isThreadableChannel(channel))
            throw new InvalidChannelError(channel.type, channel.id);

        const activeThreads = await channel.guild.getActiveThreads();
        return activeThreads.threads.filter(t => t.parentID === channel.id).map(t => t.id);
    }
}
