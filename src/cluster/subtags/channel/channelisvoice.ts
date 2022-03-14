import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { ChannelNotFoundError } from '@blargbot/cluster/bbtag/errors';
import { SubtagType } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';

export class ChannelIsVoiceSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'channelisvoice',
            aliases: ['isvoice'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the current channel is a voice channel.',
                    exampleCode: '{if;{isvoice};How did you even call the command?;Yeah you can write stuff here}',
                    exampleOut: 'Yeah you can write stuff here',
                    returns: 'boolean',
                    execute: (ctx) => this.isVoiceChannel(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a voice channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isvoice;blarg podcats}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel, quiet]) => this.isVoiceChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async isVoiceChannel(
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
        return guard.isVoiceChannel(channel);
    }
}
