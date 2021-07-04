import { BaseSubtag, discordUtil, SubtagType } from '../core';

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
                        const channel = await context.getChannel(channelStr);

                        /**
                         * TODO change this to "No channel found" for consistency
                         * * when versioning is out and about
                         */
                        if (channel === undefined)
                            return this.customError('Channel does not exist', context, subtag);
                        const permission = channel.permissionsOf(context.authorizer);

                        if (!permission.has('manageChannels'))
                            return this.customError('Author cannot edit this channel', context, subtag);

                        try {
                            const fullReason = discordUtil.formatAuditReason(
                                context.user,
                                context.scope.reason ?? ''
                            );
                            await channel.delete(fullReason);
                            if (context.guild.channels.get(channel.id) !== undefined)
                                context.guild.channels.remove(channel);
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
