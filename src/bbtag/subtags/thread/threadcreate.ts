import { guard, parse } from '@blargbot/core/utils';
import { mapping } from '@blargbot/mapping';
import { GuildFeature } from 'discord-api-types/v9';
import { Constants, CreateThreadOptions, DiscordRESTError, KnownMessage } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError, InvalidChannelError, MessageNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ThreadCreateSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'threadcreate',
            category: SubtagType.THREAD,
            aliases: ['createthread'],
            definition: [
                {
                    parameters: ['channel', 'message?', 'options'],
                    description: '`channel` defaults to the current channel\n\nCreates a new thread in `channel`. If `message` is provided, thread will start from `message`.\n`options` must be a JSON object containing `name`, other properties are:\n- `autoArchiveDuration` (one of `60, 1440, 4320, 10080`)\n- `private` (boolean)\nThe guild must have the required boosts for durations `4320` and `10080`. If `private` is true thread will be private (unless in a news channel).\nReturns the ID of the new thread channel',
                    exampleCode: '{threadcreate;;123456789123456;{json;{"name" : "Hello world!"}}}',
                    exampleOut: '98765432198765',
                    returns: 'id',
                    execute: (ctx, [channel, message, options]) => this.createThread(ctx, channel.value, message.value, options.value)
                }
            ]
        });
    }

    public async createThread(context: BBTagContext, channelStr: string, messageStr: string, optionsStr: string): Promise<string> {
        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        if (!guard.isThreadableChannel(channel))
            throw new InvalidChannelError(channel.type, channel.id);

        let message: KnownMessage | undefined;
        if (messageStr !== '') {
            message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                throw new MessageNotFoundError(channel.id, messageStr);
        }

        const mappingOptions = mapThreadOptions(optionsStr);

        if (!mappingOptions.valid)
            throw new BBTagRuntimeError('Invalid options object');
        const guildFeatures = context.guild.features;

        const input = mappingOptions.value;

        if (input.autoArchiveDuration === 4320 && !guildFeatures.includes(GuildFeature.ThreeDayThreadArchive))
            throw new BBTagRuntimeError('Guild does not have 3 day threads');

        if (input.autoArchiveDuration === 10080 && !guildFeatures.includes(GuildFeature.SevenDayThreadArchive))
            throw new BBTagRuntimeError('Guild does not have 7 day threads');

        if (input.private && !guildFeatures.includes(GuildFeature.PrivateThreads))
            throw new BBTagRuntimeError('Guild cannot have private threads');

        if (!input.private && !context.hasPermission(channel, 'createPublicThreads'))
            throw new BBTagRuntimeError('Authorizer cannot create public threads');
        if (input.private && !context.hasPermission(channel, 'createPrivateThreads'))
            throw new BBTagRuntimeError('Authorizer cannot create private threads');

        const type = input.private
            ? Constants.ChannelTypes.GUILD_PRIVATE_THREAD
            : Constants.ChannelTypes.GUILD_PUBLIC_THREAD;

        const options: CreateThreadOptions = {
            name: input.name,
            autoArchiveDuration: input.autoArchiveDuration
        };

        try {
            const threadChannel = message === undefined
                ? await channel.createThreadWithoutMessage({ ...options, invitable: true, type })
                : await channel.createThreadWithMessage(message.id, options);
            return threadChannel.id;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to create thread: ${err.message}`);
        }
    }
}

const mapAutoArchiveDuration = mapping.in(...[60, 1440, 4320, 10080] as const);
const mapThreadOptions = mapping.json(mapping.object({
    name: mapping.string,
    autoArchiveDuration: mapping.choice(
        mapping.string.map(v => parse.int(v)).chain(mapAutoArchiveDuration),
        mapAutoArchiveDuration
    ).optional.map(v => v ?? 1440),
    private: mapping.choice(
        mapping.string.map(v => parse.boolean(v)).chain(mapping.boolean),
        mapping.boolean
    ).optional.map(v => v ?? false)
}));
