import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class ChannelIsThread extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelisthread',
            aliases: ['isthread'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the current channel is a thread channel.',
                    exampleCode: '{if;{isthread};Cool, this is a thread channel!;Boo, this is a regular text channel}',
                    exampleOut: 'Cool, this is a thread channel!',
                    execute: (ctx) => guard.isThreadChannel(ctx.channel).toString()
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a thread channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isthread;blarg podcats}',
                    exampleOut: 'true',
                    execute: (ctx, [channel, quiet], subtag) => this.isThreadChannel(ctx, channel.value, quiet.value !== '', subtag)
                }
            ]
        });
    }

    public async isThreadChannel(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return guard.isThreadChannel(channel).toString();
    }
}
