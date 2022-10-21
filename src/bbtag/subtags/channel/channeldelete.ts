import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.channeldelete;

export class ChannelDeleteSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channeldelete',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['id'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
