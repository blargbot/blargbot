import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError, InvalidChannelError } from '../../errors';
import { SubtagType } from '../../utils';

export class ThreadChannelsSubtag extends CompiledSubtag {
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