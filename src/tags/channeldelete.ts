import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType, discord } from '../utils';

export class ChannelDeleteSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channeldelete',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['id'],
                    description: 'Deletes the provided `channel`.',
                    exampleCode: '{channeldelete;11111111111111111}',
                    exampleOut: '',
                    execute: async (context, [{value: channelStr}], subtag) => {
                        const channel = await context.getChannel(channelStr);

                        /**
                         * TODO change this to "No channel found" for consistency
                         * * when versioning is out and about
                         */
                        if (!channel)
                            return this.customError('Channel does not exist', context, subtag);
                        const permission = channel.permissionsOf(context.authorizer);

                        if (!permission.has('manageChannels'))
                            return this.customError('Author cannot edit this channel', context, subtag);

                        try {
                            const fullReason = discord.formatAuditReason(
                                context.user,
                                context.scope.reason || ''
                            );
                            await channel.delete(fullReason);
                            if (context.guild.channels.get(channel.id))
                                context.guild.channels.remove(channel);
                            return;//TODO return something on success
                        } catch (err) {
                            console.error(err.stack);
                            return this.customError('Failed to edit channel: no perms', context, subtag);
                        }
                    }
                }
            ]
        });
    }
}