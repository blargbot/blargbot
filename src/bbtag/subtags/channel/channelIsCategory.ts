import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { ChannelNotFoundError } from '../../errors/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.channelIsCategory;

export class ChannelIsCategorySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelIsCategory',
            aliases: ['isCategory'],
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
