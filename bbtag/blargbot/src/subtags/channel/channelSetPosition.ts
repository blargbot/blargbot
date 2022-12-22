import { BBTagRuntimeError, NotANumberError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';
import { parse } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

export class ChannelSetPositionSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelSetPosition',
            aliases: ['channelSetPos'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'position'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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

        const pos = parse.int(posStr);
        if (pos === undefined)
            throw new NotANumberError(posStr);

        //TODO maybe check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?

        try {
            await channel.editPosition(pos);
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to move channel: no perms', err.message);
        }
    }
}
