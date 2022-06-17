import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelCategorySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelcategory',
            aliases: ['category'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the category ID of the current channel.',
                    exampleCode: '{channelcategory}',
                    exampleOut: '111111111111111',
                    returns: 'id',
                    execute: (ctx) => this.getCategory(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the category ID of the provided `channel`. If the provided `channel` is a category this returns nothing. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelcategory;cool channel}\n{channelcategory;cool category}',
                    exampleOut: '111111111111111\n(nothing is returned here)',
                    returns: 'id',
                    execute: (ctx, [channel, quiet]) => this.getCategory(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getCategory(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);

        if (typeof channel.parentID !== 'string')
            throw new BBTagRuntimeError('Channel has no parent')
                .withDisplay('');

        return channel.parentID;
    }
}
