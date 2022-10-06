import { parse } from '@blargbot/core/utils';
import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, NotANumberError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelSetPosSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `channelsetpos`,
            aliases: [`channelsetposition`],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [`channel`, `position`],
                    description: `Moves a channel to the provided position.`,
                    exampleCode: `{channelsetpos;11111111111111111;5}`,
                    exampleOut: ``,
                    returns: `nothing`,
                    execute: (ctx, [channel, position]) => this.setChannelPosition(ctx, channel.value, position.value)
                }
            ]
        });
    }

    public async setChannelPosition(context: BBTagContext, channelStr: string, posStr: string): Promise<void> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError(`Channel does not exist`);//TODO No channel found error

        if (!context.hasPermission(channel, `manageChannels`))
            throw new BBTagRuntimeError(`Author cannot move this channel`);

        const pos = parse.int(posStr);
        if (pos === undefined)
            throw new NotANumberError(posStr);

        //TODO maybe check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?

        try {
            await channel.editPosition(pos);
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to move channel: no perms`, err.message);
        }
    }
}
