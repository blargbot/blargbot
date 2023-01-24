import { guard } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.channels;

@Subtag.id('channels')
@Subtag.factory()
export class ChannelsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.getChannels(ctx)
                },
                {
                    parameters: ['category', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'id[]',
                    execute: (ctx, [category, quiet]) => this.getChannelsInCategory(ctx, category.value, quiet.value !== '')
                }
            ]
        });
    }

    public getChannels(context: BBTagContext): string[] {
        return context.guild.channels.map(c => c.id);
    }

    public async getChannelsInCategory(context: BBTagContext, channelStr: string, quiet: boolean): Promise<string[]> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }
        if (!guard.isCategoryChannel(channel))
            return [];
        return channel.channels.map(c => c.id);
    }
}
