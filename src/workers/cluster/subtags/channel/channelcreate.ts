import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, guard, mapping, SubtagType } from '@cluster/utils';
import { Constants, CreateChannelOptions, Overwrite } from 'eris';

export class ChannelCreateSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'channelcreate',
            category: SubtagType.CHANNEL,
            desc: '`type` is either `text`, `voice`, `category`, `news` or `store`.\n',
            definition: [
                {
                    parameters: ['name', 'type?:text'],
                    description: 'Creates a channel of type `type`',
                    exampleCode: '{channelcreate;super-voice-channel;voice}',
                    exampleOut: '11111111111111111',
                    returns: 'id',
                    execute: (ctx, [name, type]) => this.channelCreate(ctx, name.value, type.value, '{}')
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
                    returns: 'id',
                    execute: (ctx, [name, type, options]) => this.channelCreate(ctx, name.value, type.value, options.value)
                }
            ]
        });
    }

    public async channelCreate(
        context: BBTagContext,
        name: string,
        typeKey: string,
        optionsJson: string
    ): Promise<string> {
        if (!discordUtil.hasPermission(context.authorizer, 'manageChannels'))
            throw new BBTagRuntimeError('Author cannot create channels');

        let options: CreateChannelOptions;
        try {
            const mapped = mapOptions(optionsJson);
            if (!mapped.valid)
                throw new BBTagRuntimeError('Invalid JSON');
            options = mapped.value;
        } catch (e: unknown) {
            throw new BBTagRuntimeError('Invalid JSON');
        }

        const type = guard.hasProperty(channelTypes, typeKey) ? channelTypes[typeKey] : Constants.ChannelTypes.GUILD_TEXT;

        try {
            options.reason = context.scopes.local.reason !== undefined
                ? discordUtil.formatAuditReason(context.user, context.scopes.local.reason)
                : options.reason;
            const channel = await context.guild.createChannel(name, type, options);
            return channel.id;
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to create channel: no perms');
        }
    }
}

const channelTypes = {
    text: Constants.ChannelTypes.GUILD_TEXT,
    voice: Constants.ChannelTypes.GUILD_VOICE,
    category: Constants.ChannelTypes.GUILD_CATEGORY,
    news: Constants.ChannelTypes.GUILD_NEWS,
    store: Constants.ChannelTypes.GUILD_STORE
} as const;

const mapOptions = mapping.json(
    mapping.object<CreateChannelOptions>({
        bitrate: mapping.number.optional,
        nsfw: mapping.boolean.optional,
        parentID: mapping.string.optional,
        rateLimitPerUser: mapping.number.optional,
        topic: mapping.string.optional,
        userLimit: mapping.number.optional,
        permissionOverwrites: mapping.array(
            mapping.object<Overwrite>({
                allow: mapping.bigInt.optional.map(v => v ?? 0n),
                deny: mapping.bigInt.optional.map(v => v ?? 0n),
                id: mapping.string,
                type: mapping.in('role', 'member')
                    .map(v => v === 'member' ? 'user' : v)
                    .map(v => Constants.PermissionOverwriteTypes[v.toUpperCase()])
            })
        ).optional,
        reason: mapping.string.optional
    })
);
