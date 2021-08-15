import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class ChannelIsText extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelistext',
            aliases: ['istext'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the current channel is a text channel.',
                    exampleCode: '{if;{istext};Yeah you can write stuff here;How did you even call the command?}',
                    exampleOut: 'Yeah you can write stuff here',
                    execute: (ctx) => guard.isTextableChannel(ctx.channel).toString()
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a text channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{istext;feature discussions}',
                    exampleOut: 'true',
                    execute: (ctx, [channel, quiet], subtag) => this.isTextChannel(ctx, channel.value, quiet.value !== '', subtag)
                }
            ]
        });
    }

    public async isTextChannel(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return guard.isTextableChannel(channel).toString();
    }
}
