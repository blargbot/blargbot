import { guard } from '@blargbot/core/utils';
import { mapping } from '@blargbot/mapping';
import { Constants, CreateChannelOptions, DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelCreateSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `channelcreate`,
            category: SubtagType.CHANNEL,
            description: `\`type\` is either \`text\`, \`voice\`, \`category\`, \`news\` or \`store\`.\n`,
            definition: [
                {
                    parameters: [`name`, `type?:text`, `options?:{}`],
                    description: `Creates a channel with the specified \`options\` of type \`type\`\`options\` is a JSON object, containing any or all of the following properties:\n- \`topic\`\n- \`nsfw\`\n- \`parentID\`\n- \`reason\` (displayed in audit log)\n- \`rateLimitPerUser\`\n- \`bitrate\` (voice)\n- \`userLimit\` (voice)\nReturns the new channel's ID.`,
                    exampleCode: `{channelcreate;super-channel;;{json;{"parentID":"11111111111111111"}}}`,
                    exampleOut: `22222222222222222`,
                    returns: `id`,
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
        if (!context.hasPermission(`manageChannels`))
            throw new BBTagRuntimeError(`Author cannot create channels`);

        const mapped = mapOptions(optionsJson);
        if (!mapped.valid)
            throw new BBTagRuntimeError(`Invalid JSON`);
        const options = mapped.value;

        const type = guard.hasProperty(channelTypes, typeKey) ? channelTypes[typeKey] : Constants.ChannelTypes.GUILD_TEXT;

        for (const permission of options.permissionOverwrites ?? [])
            if (!context.hasPermission((permission.allow as bigint) | (permission.deny as bigint)))
                throw new BBTagRuntimeError(`Author missing requested permissions`);

        try {
            options.reason ||= context.auditReason();
            const channel = await context.guild.createChannel(name, type, options);
            return channel.id;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to create channel: no perms`, err.message);
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
            mapping.object({
                allow: mapping.bigInt.optional.map(v => v ?? 0n),
                deny: mapping.bigInt.optional.map(v => v ?? 0n),
                id: mapping.string,
                type: mapping.in(`role`, `member`)
                    .map(v => v === `member` ? `user` : v)
                    .map(v => Constants.PermissionOverwriteTypes[v.toUpperCase()])
            })
        ).optional,
        reason: mapping.string.optional,
        position: [undefined]
    })
);
