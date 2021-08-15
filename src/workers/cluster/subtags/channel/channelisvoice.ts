import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class ChannelIsVoice extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelisvoice',
            aliases: ['isvoice'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the current channel is a voice channel.',
                    exampleCode: '{if;{isvoice};How did you even call the command?;Yeah you can write stuff here}',
                    exampleOut: 'Yeah you can write stuff here',
                    execute: (ctx) => guard.isVoiceChannel(ctx.channel).toString()
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a voice channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isvoice;blarg podcats}',
                    exampleOut: 'true',
                    execute: (ctx, [channel, quiet], subtag) => this.isVoiceChannel(ctx, channel.value, quiet.value, subtag)
                }
            ]
        });
    }

    public async isVoiceChannel(
        context: BBTagContext,
        channelStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr.length > 0;
        const channel = await context.getChannel(channelStr, { quiet, suppress: context.scope.suppressLookup });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return guard.isVoiceChannel(channel).toString();
    }
}
