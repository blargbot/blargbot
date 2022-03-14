import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { ChannelNotFoundError } from '@blargbot/cluster/bbtag/errors';
import { SubtagType } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';

export class ChannelIsCategorySubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'channeliscategory',
            aliases: ['iscategory'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a category. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{channeliscategory;cool category}\n{channeliscategory;category that doesn\'t exist}',
                    exampleOut: 'true\n(nothing is returned here)',
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
