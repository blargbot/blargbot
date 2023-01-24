import type { Logger } from '@blargbot/logger';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.dm;

@Subtag.id('dm')
@Subtag.ctorArgs(Subtag.util(), Subtag.converter(), Subtag.logger())
export class DMSubtag extends CompiledSubtag {
    readonly #dmCache: DMCache = {};
    readonly #util: BBTagUtilities;
    readonly #converter: BBTagValueConverter;
    readonly #logger: Logger;

    public constructor(util: BBTagUtilities, converter: BBTagValueConverter, logger: Logger) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user', 'message'],
                    description: tag.text.description,
                    exampleCode: tag.text.exampleCode,
                    exampleOut: tag.text.exampleOut
                },
                {
                    parameters: ['user', 'embed'],
                    description: tag.embed.description,
                    exampleCode: tag.embed.exampleCode,
                    exampleOut: tag.embed.exampleOut
                },
                {
                    parameters: ['user', 'content'],
                    returns: 'nothing',
                    execute: (ctx, [user, content]) => this.sendDm(ctx, user.value, content.value, undefined)
                },
                {
                    parameters: ['user', 'message', 'embed'],
                    description: tag.full.description,
                    exampleCode: tag.full.exampleCode,
                    exampleOut: tag.full.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [user, message, embed]) => this.sendDm(ctx, user.value, message.value, embed.value)
                }
            ]
        });

        this.#util = util;
        this.#converter = converter;
        this.#logger = logger;
    }

    public async sendDm(
        context: BBTagContext,
        userStr: string,
        messageStr: string,
        embedStr?: string
    ): Promise<void> {
        const member = await context.queryMember(userStr);
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        const messageAsEmbeds = embedStr === undefined ? this.#converter.embed(messageStr, false) : undefined;
        const embeds = messageAsEmbeds ?? this.#converter.embed(embedStr);
        const content = messageAsEmbeds === undefined ? messageStr : undefined;

        try {
            let cache = this.#dmCache[member.id];
            const channel = await member.user.getDMChannel();
            if (cache === undefined ||
                cache.count > 5 ||
                cache.user !== context.user.id ||
                cache.guild !== context.guild.id) {
                // Ew we're gonna send a message first? It was voted...
                // TODO: Maybe change to a footer embed on every DM? I dont think its possible to disable embeds in DMs
                await this.#util.send(channel, { content: `The following message was sent from **__${context.guild.name}__** (${context.guild.id}), and was sent by **__${context.user.username}#${context.user.discriminator}__** (${context.user.id}):` });
                cache = this.#dmCache[member.id] = { user: context.user.id, guild: context.guild.id, count: 1 };
            }

            context.data.nsfw === undefined
                ? await this.#util.send(channel, { content, embeds })
                : await this.#util.send(channel, { content: context.data.nsfw });
            cache.count++;
        } catch (e: unknown) {
            this.#logger.error('DM failed', e);
            throw new BBTagRuntimeError('Could not send DM');
        }
    }
}

interface DMCache {
    [index: string]: {
        guild: string;
        count: number;
        user: string;
    } | undefined;
}
