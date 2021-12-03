import { BBTagContext, Subtag } from '@cluster/bbtag';
import { ChannelNotFoundError } from '@cluster/bbtag/errors';
import { guard, SubtagType } from '@cluster/utils';

export class ChannelIsNsfw extends Subtag {
    public constructor() {
        super({
            name: 'channelisnsfw',
            category: SubtagType.CHANNEL,
            aliases: ['isnsfw'],
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the current channel is a NSFW channel.',
                    exampleCode: '{if;{isnsfw};Spooky nsfw stuff;fluffy bunnies}',
                    exampleOut: 'fluffy bunnies',
                    returns: 'boolean',
                    execute: (ctx) => this.isNsfwChannel(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a NSFW channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isnsfw;SFW Cat pics}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel, quiet]) => this.isNsfwChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async isNsfwChannel(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<boolean> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }
        return !guard.isThreadChannel(channel) && guard.isTextableChannel(channel) && channel.nsfw;
    }
}
