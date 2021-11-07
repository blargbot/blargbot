import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { guard, SubtagType } from '@cluster/utils';

export class ChannelIsNsfw extends BaseSubtag {
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
                    execute: (ctx) => (!guard.isThreadChannel(ctx.channel) && ctx.channel.nsfw).toString()
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a NSFW channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isnsfw;SFW Cat pics}',
                    exampleOut: 'true',
                    execute: (ctx, [channel, quiet], subtag) => this.isNsfwChannel(ctx, channel.value, quiet.value !== '', subtag)
                }
            ]
        });
    }

    public async isNsfwChannel(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return (!guard.isThreadChannel(channel) && guard.isTextableChannel(channel) && channel.nsfw).toString();
    }
}
