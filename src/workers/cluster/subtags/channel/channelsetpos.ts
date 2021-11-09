import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class ChannelSetPosSubtag extends BaseSubtag {
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
                    execute: async (context, [{ value: channelStr }, { value: posStr }]) => {
                        const channel = await context.queryChannel(channelStr);

                        if (channel === undefined)
                            throw new BBTagRuntimeError('Channel does not exist');//TODO No channel found error

                        const permission = channel.permissionsFor(context.authorizer);

                        if (permission?.has('MANAGE_CHANNELS') !== true)
                            throw new BBTagRuntimeError('Author cannot move this channel');

                        const pos = parse.int(posStr);//TODO not a number error
                        //TODO maybe also check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?
                        try {
                            await channel.edit({ position: pos });
                            return; //TODO return something on success
                        } catch (err: unknown) {
                            context.logger.error(err);
                            throw new BBTagRuntimeError('Failed to move channel: no perms');
                        }
                    }
                }
            ]
        });
    }
}
