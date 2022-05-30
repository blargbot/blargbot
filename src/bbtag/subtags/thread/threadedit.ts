import { guard, parse } from '@blargbot/core/utils';
import { mapping } from '@blargbot/mapping';
import { GuildFeature } from 'discord-api-types/v9';
import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError, InvalidChannelError } from '../../errors';
import { SubtagType } from '../../utils';

export class ThreadEditSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'threadedit',
            category: SubtagType.THREAD,
            aliases: ['editthread'],
            definition: [
                {
                    parameters: ['threadChannel', 'options'],
                    description: '`threadChannel` defaults to the current channel\n`options` must be a JSON object\n\nEdits `threadChannel` with `options`.\n`options` can have the following properties:\n' +
                        '- `name`\n- `autoArchiveDuration`\n- `private`\n- `invitable`\n- `rateLimitPerUser`\n- `locked`\n- `archived`\n' +
                        'For information about these properties see [the docs](https://discord.com/developers/docs/resources/channel#allowed-mentions-object-json-params-thread)\nReturns `true` if successful,  ',
                    exampleCode: '{threadedit;123456789123456;{json;{"name" : "Hello world!"}}}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel, options]) => this.editThread(ctx, channel.value, options.value)
                }
            ]
        });
    }

    public async editThread(
        context: BBTagContext,
        threadStr: string,
        optionsStr: string
    ): Promise<boolean> {
        const threadChannel = threadStr === '' ? context.channel : await context.queryThread(threadStr);
        if (threadChannel === undefined)
            throw new ChannelNotFoundError(threadStr);
        if (!guard.isThreadChannel(threadChannel))
            throw new InvalidChannelError(threadChannel.type, threadStr);

        if (!context.hasPermission(threadChannel, 'manageThreads'))
            throw new BBTagRuntimeError('Authorizer cannot edit threads');
        if (!threadChannel.permissionsOf(context.discord.user.id).has('manageThreads'))
            throw new BBTagRuntimeError('Bot cannot edit threads');

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

        if (input.private === true && !guildFeatures.includes(GuildFeature.PrivateThreads))
            throw new BBTagRuntimeError('Guild cannot have private threads');

        try {
            await threadChannel.edit(input, context.auditReason(context.user));
            return true;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to create thread: ${err.message}`);
        }
    }
}

const mapAutoArchiveDuration = mapping.in(...[60, 1440, 4320, 10080] as const);
const mapThreadOptions = mapping.json(mapping.object({
    name: mapping.string.optional,
    autoArchiveDuration: mapping.choice(
        mapping.string.map(v => parse.int(v)).chain(mapAutoArchiveDuration),
        mapAutoArchiveDuration
    ).optional,
    private: mapping.choice(
        mapping.string.map(v => parse.boolean(v)).chain(mapping.boolean),
        mapping.boolean
    ).optional,
    invitable: mapping.choice(
        mapping.string.map(v => parse.boolean(v)).chain(mapping.boolean),
        mapping.boolean
    ).optional,
    rateLimitPerUser: mapping.choice(
        mapping.string.map(v => parse.int(v)).chain(mapping.number),
        mapping.number
    ).optional,
    locked: mapping.choice(
        mapping.string.map(v => parse.boolean(v)).chain(mapping.boolean),
        mapping.boolean
    ).optional,
    archived: mapping.choice(
        mapping.string.map(v => parse.boolean(v)).chain(mapping.boolean),
        mapping.boolean
    ).optional
}));
