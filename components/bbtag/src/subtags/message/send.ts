import type { MalformedEmbed } from '@blargbot/core/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import type { GuildStore } from '@blargbot/domain/stores/GuildStore.js';
import type { Logger } from '@blargbot/logger';
import * as Eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.send;

@Subtag.id('send')
@Subtag.factory(Subtag.util(), Subtag.converter(), Subtag.store('guilds'), Subtag.logger())
export class SendSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;
    readonly #converter: BBTagValueConverter;
    readonly #guilds: GuildStore;
    readonly #logger: Logger;

    public constructor(util: BBTagUtilities, converter: BBTagValueConverter, guilds: GuildStore, logger: Logger) {
        super({
            category: SubtagType.MESSAGE,
            description: tag.description,
            definition: [
                {
                    parameters: ['channel', 'message', 'embed', 'fileContent', 'fileName?:file.txt'],
                    description: tag.full.description,
                    exampleCode: tag.full.exampleCode,
                    exampleOut: tag.full.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, message, embed, fileContent, fileName]) => this.send(ctx, channel.value, message.value, this.#converter.embed(embed.value), { file: fileContent.value, name: fileName.value })
                },
                {
                    parameters: ['channel', 'message', 'embed'],
                    description: tag.textAndEmbed.description,
                    exampleCode: tag.textAndEmbed.exampleCode,
                    exampleOut: tag.textAndEmbed.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, message, embed]) => this.send(ctx, channel.value, message.value, this.#converter.embed(embed.value))
                },
                {
                    parameters: ['channel', 'content'],
                    description: tag.textOrEmbed.description,
                    exampleCode: tag.textOrEmbed.exampleCode,
                    exampleOut: tag.textOrEmbed.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, content]) => this.send(ctx, channel.value, ...this.#resolveContent(content.value))
                }
            ]
        });

        this.#converter = converter;
        this.#guilds = guilds;
        this.#logger = logger;
        this.#util = util;
    }

    public async send(context: BBTagContext, channelId: string, message?: string, embed?: Eris.EmbedOptions[] | MalformedEmbed[], file?: Eris.FileContent): Promise<string> {
        const channel = await context.queryChannel(channelId, { noLookup: true });
        if (channel === undefined || !guard.isTextableChannel(channel))
            throw new ChannelNotFoundError(channelId);

        if (typeof file?.file === 'string' && file.file.startsWith('buffer:'))
            file.file = Buffer.from(file.file.slice(7), 'base64');

        const disableEveryone = !context.isCC
            || (await this.#guilds.getSetting(channel.guild.id, 'disableeveryone')
                ?? !context.data.allowedMentions.everybody);

        try {
            const sent = await this.#util.send(channel, {
                content: message,
                embeds: embed !== undefined ? embed : undefined,
                nsfw: context.data.nsfw,
                allowedMentions: {
                    everyone: !disableEveryone,
                    roles: context.isCC ? context.data.allowedMentions.roles : undefined,
                    users: context.isCC ? context.data.allowedMentions.users : undefined
                },
                file: file !== undefined ? [file] : undefined
            });

            if (sent === undefined)
                throw new BBTagRuntimeError('Send unsuccessful');

            context.data.ownedMsgs.push(sent.id);
            return sent.id;
        } catch (err: unknown) {
            if (err instanceof BBTagRuntimeError)
                throw err;
            if (err instanceof Eris.DiscordRESTError)
                throw new BBTagRuntimeError(`Failed to send: ${err.message}`);
            if (!(err instanceof Error && err.message === 'No content'))
                this.#logger.error('Failed to send!', err);
            throw new BBTagRuntimeError('Failed to send: UNKNOWN');
        }

    }

    #resolveContent(content: string): [string | undefined, Eris.EmbedOptions[] | undefined] {
        const embeds = this.#converter.embed(content);
        if (embeds === undefined || 'malformed' in embeds[0])
            return [content, undefined];
        return [undefined, embeds];
    }
}
