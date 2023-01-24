import { guard } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.channelIsCategory;

@Subtag.id('channelIsCategory', 'isCategory')
@Subtag.factory()
export class ChannelIsCategorySubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [channel, quiet]) => this.isCategory(ctx, channel.value, quiet.value !== '')

                }
            ]
        });
    }

    public async isCategory(
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
        return guard.isCategoryChannel(channel);
    }
}
