import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.channelisnsfw;

export class ChannelIsNsfwSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelisnsfw',
            category: SubtagType.CHANNEL,
            aliases: ['isnsfw'],
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'boolean',
                    execute: (ctx) => this.isNsfwChannel(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
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
        return !guard.isThreadChannel(channel) && guard.isTextableChannel(channel) && channel.nsfw || false;
    }
}
