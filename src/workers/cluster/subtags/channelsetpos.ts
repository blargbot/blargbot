import { BaseSubtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class ChannelSetPosSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelsetpos',
            aliases: ['channelsetposition'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['channel', 'position'],
                    description: 'Moves a channel to the provided position.',
                    exampleCode: '{channelsetpos;11111111111111111;5}',
                    exampleOut: '',
                    execute: async (context, [{ value: channelStr }, { value: posStr }], subtag) => {
                        const channel = await context.getChannel(channelStr);

                        if (channel === undefined)
                            return this.customError('Channel does not exist', context, subtag);//TODO No channel found error

                        const permission = channel.permissionsOf(context.authorizer);

                        if (!permission.has('manageChannels'))
                            return this.customError('Author cannot move this channel', context, subtag);

                        const pos = parse.int(posStr);//TODO not a number error
                        //TODO maybe also check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?
                        try {
                            await channel.editPosition(pos);
                            return; //TODO return something on success
                        } catch (err: unknown) {
                            context.logger.error(err);
                            return this.customError('Failed to move channel: no perms', context, subtag);
                        }
                    }
                }
            ]
        });
    }
}
