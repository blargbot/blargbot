import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';

export class ChannelDeleteSubtag extends Subtag {
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
                    execute: async (context, [{ value: channelStr }]) => {
                        const channel = await context.queryChannel(channelStr);

                        /**
                         * TODO change this to "No channel found" for consistency
                         * * when versioning is out and about
                         */
                        if (channel === undefined)
                            throw new BBTagRuntimeError('Channel does not exist');
                        const permission = channel.permissionsFor(context.authorizer);

                        if (permission?.has('MANAGE_CHANNELS') !== true)
                            throw new BBTagRuntimeError('Author cannot edit this channel');

                        try {
                            const fullReason = discordUtil.formatAuditReason(
                                context.user,
                                context.scopes.local.reason ?? ''
                            );
                            await channel.delete(fullReason);
                            return;//TODO return something on success
                        } catch (err: unknown) {
                            context.logger.error(err);
                            throw new BBTagRuntimeError('Failed to edit channel: no perms');
                        }
                    }
                }
            ]
        });
    }
}
