import { Cluster } from '../Cluster';
import { BaseSubtag, BBTagContext, discordUtil, SubtagCall, SubtagType } from '../core';
import { EditChannelOptions } from 'eris';

export class ChannelEditSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'channeledit',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['channel', 'options?:{}'],
                    description: 'Edits a channel with the given information.\n' +
                        '`options` is a JSON object, containing any or all of the following properties:\n' +
                        '- `name`\n' +
                        '- `topic`\n' +
                        '- `nsfw`\n' +
                        '- `parentID`\n' +
                        '- `reason` (displayed in audit log)\n' +
                        '- `rateLimitPerUser`\n' +
                        '- `bitrate` (voice)\n' +
                        '- `userLimit` (voice)\n' +
                        'Returns the channel\'s ID.',
                    exampleCode: '{channeledit;11111111111111111;{j;{"name": "super-cool-channel"}}}',
                    exampleOut: '11111111111111111',
                    execute: (ctx, args, subtag) => this.channelEdit(ctx, [...args.map(arg => arg.value), '{}'], subtag)
                }
            ]
        });
    }

    public async channelEdit(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.getChannel(args[0]);

        if (!channel)
            return this.customError('Channel does not exist', context, subtag);//TODO no channel found error

        const permission = channel.permissionsOf(context.authorizer);

        if (!permission.has('manageChannels'))
            return this.customError('Author cannot edit this channel', context, subtag);

        let options: EditChannelOptions;
        try {
            options = JSON.parse(args[1]);
            if (typeof options !== 'object' || Array.isArray(options))
                return this.customError('Invalid JSON', context, subtag);
        } catch (e) {
            return this.customError('Invalid JSON', context, subtag);
        }

        try {
            const fullReason = discordUtil.formatAuditReason(
                context.user,
                context.scope.reason || ''
            );
            await channel.edit(options, fullReason);
            if (!context.guild.channels.get(channel.id))
                context.guild.channels.add(channel);
            return channel.id;
        } catch (err) {
            this.logger.error(err.stack);
            return this.customError('Failed to edit channel: no perms', context, subtag);
        }
    }
}