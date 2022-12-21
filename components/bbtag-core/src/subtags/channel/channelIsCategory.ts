import { guard } from '@blargbot/core/utils/index.js';

import { ChannelNotFoundError } from '../../errors/index.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class ChannelIsCategorySubtag extends Subtag {
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
