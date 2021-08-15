import { BaseSubtag } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';

export class ChannelDeleteSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channeldelete',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['id'],
                    description: 'Deletes the provided `channel`.',
                    exampleCode: '{channeldelete;11111111111111111}',
                    exampleOut: '',
                    execute: async (context, [{ value: channelStr }], subtag) => {
                        const channel = await context.queryChannel(channelStr);

                        /**
                         * TODO change this to "No channel found" for consistency
                         * * when versioning is out and about
                         */
                        if (channel === undefined)
                            return this.customError('Channel does not exist', context, subtag);
                        const permission = channel.permissionsFor(context.authorizer);

                        if (permission?.has('MANAGE_CHANNELS') !== true)
                            return this.customError('Author cannot edit this channel', context, subtag);

                        try {
                            const fullReason = discordUtil.formatAuditReason(
                                context.user,
                                context.scope.reason ?? ''
                            );
                            await channel.delete(fullReason);
                            return;//TODO return something on success
                        } catch (err: unknown) {
                            context.logger.error(err);
                            return this.customError('Failed to edit channel: no perms', context, subtag);
                        }
                    }
                }
            ]
        });
    }
}
