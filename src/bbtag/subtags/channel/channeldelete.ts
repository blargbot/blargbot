import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelDeleteSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channeldelete',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['id'],
                    description: 'Deletes the provided `channel`.',
                    exampleCode: '{channeldelete;11111111111111111}',
                    exampleOut: '',
                    returns: 'nothing',
                    execute: (ctx, [channel]) => this.deleteChannel(ctx, channel.value)
                }
            ]
        });
    }

    public async deleteChannel(context: BBTagContext, channelStr: string): Promise<void> {
        const channel = await context.queryChannel(channelStr);

        /**
         * TODO change this to "No channel found" for consistency
         * * when versioning is out and about
         */
        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');

        if (!context.hasPermission(channel, 'manageChannels'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        try {
            await channel.delete(context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to edit channel: no perms', err.message);
        }
    }
}
