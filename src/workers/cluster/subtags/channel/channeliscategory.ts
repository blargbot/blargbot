import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class ChannelIsCategorySubtag extends BaseSubtag {
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
                    execute: (ctx, [channel, quiet], subtag) => this.isCategory(ctx, channel.value, quiet.value !== '', subtag)

                }
            ]
        });
    }

    public async isCategory(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return guard.isCategoryChannel(channel).toString();
    }
}
