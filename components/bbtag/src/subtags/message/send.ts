import Discord from '@blargbot/discord-types';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { Entities } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.send;

@Subtag.names('send')
@Subtag.ctorArgs(Subtag.converter(), Subtag.service('channel'), Subtag.service('message'))
export class SendSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #channels: ChannelService;
    readonly #messages: MessageService;

    public constructor(converter: BBTagValueConverter, channels: ChannelService, messages: MessageService) {
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
                    execute: (ctx, [channel, message, embed, fileContent, fileName]) => this.send(ctx, channel.value, message.value, this.#converter.embed(embed.value, { allowMalformed: true }), { file: fileContent.value, name: fileName.value })
                },
                {
                    parameters: ['channel', 'message', 'embed'],
                    description: tag.textAndEmbed.description,
                    exampleCode: tag.textAndEmbed.exampleCode,
                    exampleOut: tag.textAndEmbed.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, message, embed]) => this.send(ctx, channel.value, message.value, this.#converter.embed(embed.value, { allowMalformed: true }))
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
        this.#channels = channels;
        this.#messages = messages;
    }

    public async send(context: BBTagContext, channelId: string, message?: string, embed?: Entities.Message['embeds'], file?: Entities.FileContent): Promise<string> {
        const channel = await this.#channels.querySingle(context, channelId, { noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelId);

        if (file !== undefined) {
            if (file.file.startsWith('buffer:'))
                file.file = file.file.slice(7);
            else
                file.file = Buffer.from(file.file).toString('base64');
        }

        const disableEveryone = !context.isCC || !context.data.allowedMentions.everybody;

        const result = await this.#messages.create(context, channel.id, {
            content: message,
            embeds: embed !== undefined ? embed : undefined,
            allowed_mentions: {
                parse: disableEveryone ? [] : [Discord.AllowedMentionsTypes.Everyone],
                roles: context.isCC ? context.data.allowedMentions.roles : undefined,
                users: context.isCC ? context.data.allowedMentions.users : undefined
            },
            files: file !== undefined ? [file] : undefined
        });

        if (result === undefined)
            throw new BBTagRuntimeError('Send unsuccessful');

        if (!('error' in result)) {
            context.data.ownedMsgs.push(result.id);
            return result.id;
        }

        throw new BBTagRuntimeError(`Failed to send: ${result.error}`);

    }

    #resolveContent(content: string): [string | undefined, Entities.Message['embeds'] | undefined] {
        const embeds = this.#converter.embed(content);
        if (embeds === undefined)
            return [content, undefined];
        return [undefined, embeds];
    }
}
