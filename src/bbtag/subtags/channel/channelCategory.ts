import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.channelCategory;

export class ChannelCategorySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelCategory',
            aliases: ['category'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getCategory(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
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
