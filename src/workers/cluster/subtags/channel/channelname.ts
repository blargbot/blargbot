import { BBTagContext, Subtag } from '@cluster/bbtag';
import { ChannelNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class ChannelNameSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelname',
            aliases: ['categoryname'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the name of the current channel.',
                    exampleCode: 'This channel\'s name is {channelname}',
                    exampleOut: 'This channel\'s name is test-channel',
                    returns: 'string',
                    execute: (ctx) => this.getChannelName(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the name of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelname;111111111111111}',
                    exampleOut: 'cooler-test-channel',
                    returns: 'string',
                    execute: (ctx, [channel, quiet]) => this.getChannelName(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getChannelName(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }
        return channel.name;
    }
}
