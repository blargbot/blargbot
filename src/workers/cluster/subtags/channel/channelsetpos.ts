import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class ChannelSetPosSubtag extends Subtag {
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

        const permission = channel.permissionsOf(context.authorizer);

        if (permission.has('manageChannels') !== true)
            throw new BBTagRuntimeError('Author cannot move this channel');

        const pos = parse.int(posStr);//TODO not a number error
        //TODO maybe also check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?
        try {
            await channel.editPosition(pos);
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to move channel: no perms');
        }
    }
}
