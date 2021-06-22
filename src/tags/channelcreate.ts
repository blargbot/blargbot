import { Cluster } from '../cluster';
import { BaseSubtag, SubtagCall, BBTagContext } from '../core/bbtag';
import { SubtagType, discord } from '../utils';
import { CreateChannelOptions, AnyGuildChannel } from 'eris';

const typeMap: Record<string, 0|2|4|5|6> = {
    text: 0,
    voice: 2,
    category: 4,
    news: 5,
    store: 6
};

export class ChannelCreateSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'channelcreate',
            category: SubtagType.API,
            desc: '`type` is either `text`, `voice`, `category`, `news` or `store`.\n',
            definition: [
                {
                    parameters: ['name', 'type?:text'],
                    description: 'Creates a channel of type `type`',
                    exampleCode: '{channelcreate;super-voice-channel;voice}',
                    exampleOut: '11111111111111111',
                    execute: (ctx, args, subtag) => this.channelCreate(ctx, [...args.map(arg => arg.value), '{}'], subtag)
                },
                {
                    parameters: ['name', 'type:text', 'options:{}'],
                    description: 'Creates a channel with the specified `options` of type `type`' +
                    '`options` is a JSON object, containing any or all of the following properties:\n' +
                    '- `topic`\n' +
                    '- `nsfw`\n' +
                    '- `parentID`\n' +
                    '- `reason` (displayed in audit log)\n' +
                    '- `rateLimitPerUser`\n' +
                    '- `bitrate` (voice)\n' +
                    '- `userLimit` (voice)\n' +
                    'Returns the new channel\'s ID.',
                    exampleCode: '{channelcreate;super-channel;;{json;{"parentID":"11111111111111111"}}}',
                    exampleOut: '22222222222222222',
                    execute: (ctx, args, subtag) => this.channelCreate(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async channelCreate(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const permissions = context.permissions;
        if (!permissions.has('manageChannels'))
            return this.customError('Author cannot create channels', context, subtag);

        const name = args[0];
        const type = typeMap[args[1].toLowerCase()] || 0;
        let options: CreateChannelOptions;
        try {
            options = JSON.parse(args[2]);
            if (typeof options !== 'object' || Array.isArray(options))
                return this.customError('Invalid JSON', context, subtag);
        } catch(e) {
            return this.customError('Invalid JSON', context, subtag);
        }

        try {
            options.reason = context.scope.reason ? discord.formatAuditReason(context.user, context.scope.reason || '') : options.reason;
            const channel = await context.guild.createChannel(name, type, options) as AnyGuildChannel;
            if (!context.guild.channels.get(channel.id))
                context.guild.channels.add(channel);
            return channel.id;
        } catch (err) {
            console.error(err.stack);
            return this.customError('Failed to create channel: no perms',context, subtag);
        }
    }
}