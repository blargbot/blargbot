import { guard } from '@blargbot/core/utils';
import { GuildChannel } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelPosSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelpos',
            aliases: ['categorypos'],
            category: SubtagType.CHANNEL,
            description: 'The position is the index per channel type (text, voice or category) in the channel list.',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the position of the current channel.',
                    exampleCode: 'This channel is in position {channelpos}',
                    exampleOut: 'This channel is in position 1',
                    returns: 'number',
                    execute: (ctx) => this.#getChanelPosition(ctx.channel)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the position of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'The position of test-channel is {channelpos;test-channel}',
                    exampleOut: 'The position of test-channel is 0',
                    returns: 'number',
                    execute: (ctx, [channel, quiet]) => this.getChannelPosition(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getChannelPosition(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<number> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return this.#getChanelPosition(channel);
    }

    #getChanelPosition(channel: GuildChannel): number {
        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Threads dont have a position', `${channel.mention} is a thread and doesnt have a position`);

        return channel.position;
    }
}
