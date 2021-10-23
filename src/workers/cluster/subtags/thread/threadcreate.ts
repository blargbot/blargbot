import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, discordUtil, guard, mapping, parse, SubtagType } from '@cluster/utils';
import { AllowedThreadTypeForTextChannel, GuildMessage, ThreadAutoArchiveDuration, ThreadCreateOptions } from 'discord.js';

const threadOptions = mapping.object({
    name: mapping.string,
    autoArchiveDuration: mapping.choice(
        mapping.in(undefined),
        mapping.string,
        mapping.number
    ),
    private: mapping.choice(
        mapping.in(undefined),
        mapping.string,
        mapping.boolean
    )
});

export class ThreadCreateSubtag extends BaseSubtag {
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
                    execute: async (context, args, subtag): Promise<string | void> => {
                        let channel;
                        if (args[0].value === '')
                            channel = context.channel;
                        else {
                            channel = await context.queryChannel(args[0].value);
                            if (channel === undefined)
                                return this.channelNotFound(context, subtag);
                        }
                        if (!guard.isThreadableChannel(channel))
                            return this.customError(discordUtil.notThreadable(channel), context, subtag);

                        let message: GuildMessage | undefined;
                        if (args[1].value !== '') {
                            try {
                                const maybeMessage = await context.util.getMessage(channel, args[1].value);
                                if (maybeMessage === undefined)
                                    return this.noMessageFound(context, subtag);
                                if (!guard.isGuildMessage(maybeMessage))
                                    return this.customError('Message not in guild', context, subtag);
                                message = maybeMessage;
                            } catch (e: unknown) {
                                return this.noMessageFound(context, subtag);
                            }
                        }

                        const mappingOptions = threadOptions((await bbtagUtil.json.parse(context, args[2].value)).object);

                        if (!mappingOptions.valid)
                            return this.customError('Invalid options object', context, subtag);
                        const guildFeatures = context.guild.features;

                        const input = mappingOptions.value;
                        if (input.autoArchiveDuration !== undefined)
                            input.autoArchiveDuration = parse.int(input.autoArchiveDuration);
                        else
                            input.autoArchiveDuration = 1440;

                        if (![60, 1440].includes(input.autoArchiveDuration)) {
                            if (input.autoArchiveDuration === 10080 && !guildFeatures.includes('SEVEN_DAY_THREAD_ARCHIVE')) {
                                return this.customError('Guild does not have 7 day threads', context, subtag, 'Missing boosts');
                            } else if (input.autoArchiveDuration === 4320 && !guildFeatures.includes('THREE_DAY_THREAD_ARCHIVE')) {
                                return this.customError('Guild does not have 3 day threads', context, subtag, 'Missing boosts');
                            }
                            return this.customError('Invalid autoArchiveDuration', context, subtag);
                        }

                        const options: ThreadCreateOptions<AllowedThreadTypeForTextChannel> = {
                            name: input.name,
                            autoArchiveDuration: <ThreadAutoArchiveDuration>input.autoArchiveDuration
                        };

                        if (parse.boolean(input.private) === true) {
                            if (!guildFeatures.includes('PRIVATE_THREADS'))
                                return this.customError('Guild cannot have private threads', context, subtag);
                            options.type = 'GUILD_PRIVATE_THREAD';
                        } else {
                            options.type = 'GUILD_PUBLIC_THREAD';
                        }

                        if (message !== undefined)
                            options.startMessage = message.id;

                        try {
                            const threadChannel = await channel.threads.create(options);
                            return threadChannel.id;
                        } catch (e: unknown) {
                            if (e instanceof Error) {
                                context.logger.error(e);
                                return this.customError(e.message, context, subtag);
                            }
                        }
                    }
                }
            ]
        });
    }
}
