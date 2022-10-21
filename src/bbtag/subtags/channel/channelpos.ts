import { guard } from '@blargbot/core/utils';
import { GuildChannel } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.channelpos;

export class ChannelPosSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelpos',
            aliases: ['categorypos'],
            category: SubtagType.CHANNEL,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'number',
                    execute: (ctx) => this.#getChanelPosition(ctx.channel)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
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
