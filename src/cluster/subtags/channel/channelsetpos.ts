import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@blargbot/cluster/bbtag/errors';
import { parse, SubtagType } from '@blargbot/cluster/utils';
import { ApiError, DiscordRESTError } from 'eris';

export class ChannelSetPosSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'channelsetpos',
            aliases: ['channelsetposition'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'position'],
                    description: 'Moves a channel to the provided position.',
                    exampleCode: '{channelsetpos;11111111111111111;5}',
                    exampleOut: '',
                    returns: 'nothing',
                    execute: (ctx, [channel, position]) => this.setChannelPosition(ctx, channel.value, position.value)
                }
            ]
        });
    }

    public async setChannelPosition(context: BBTagContext, channelStr: string, posStr: string): Promise<void> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');//TODO No channel found error

        if (!context.hasPermission(channel, 'manageChannels'))
            throw new BBTagRuntimeError('Author cannot move this channel');

        const pos = parse.int(posStr, false);
        if (pos === undefined)
            throw new NotANumberError(posStr);

        //TODO maybe check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?

        try {
            await channel.editPosition(pos);
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to move channel: ${err.code === ApiError.MISSING_PERMISSIONS ? 'no perms' : err.message}`);
        }
    }
}
