import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError, InvalidChannelError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { guard, mapping, parse, SubtagType } from '@cluster/utils';
import { GuildFeature } from 'discord-api-types';
import { Constants, CreateThreadOptions, DiscordRESTError, KnownMessage } from 'eris';

export class ThreadCreateSubtag extends DefinedSubtag {
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

        switch (input.autoArchiveDuration) {
            case 4320:
                if (!guildFeatures.includes(GuildFeature.ThreeDayThreadArchive))
                    throw new BBTagRuntimeError('Guild does not have 3 day threads');
                break;
            case 10080:
                if (!guildFeatures.includes(GuildFeature.SevenDayThreadArchive))
                    throw new BBTagRuntimeError('Guild does not have 7 day threads');
                break;
        }

        if (input.private && !guildFeatures.includes(GuildFeature.PrivateThreads))
            throw new BBTagRuntimeError('Guild cannot have private threads');

        const type = input.private === true
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
        } catch (e: unknown) {
            if (!(e instanceof DiscordRESTError))
                throw e;

            throw new BBTagRuntimeError(`Failed to create thread: ${e.message}`);
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
