import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { ChannelNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class ChannelIsTextSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'channelistext',
            aliases: ['istext'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the current channel is a text channel.',
                    exampleCode: '{if;{istext};Yeah you can write stuff here;How did you even call the command?}',
                    exampleOut: 'Yeah you can write stuff here',
                    returns: 'boolean',
                    execute: (ctx) => this.isTextChannel(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a text channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{istext;feature discussions}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel, quiet]) => this.isTextChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async isTextChannel(
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
        return guard.isTextableChannel(channel);
    }
}
