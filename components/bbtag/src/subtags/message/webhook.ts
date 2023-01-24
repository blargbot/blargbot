import type { Logger } from '@blargbot/logger';
import * as Eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.webhook;

@Subtag.id('webhook')
@Subtag.factory(Subtag.converter(), Subtag.logger())
export class WebhookSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #logger: Logger;

    public constructor(converter: BBTagValueConverter, logger: Logger) {
        super({
            category: SubtagType.MESSAGE,
            description: tag.description,
            definition: [
                {
                    parameters: ['id', 'token'], //! Idk why allowing users to use 2 args is even a thing, it will just error because the message is empty
                    description: tag.empty.description,
                    exampleCode: tag.empty.exampleCode,
                    exampleOut: tag.empty.exampleOut, //TODO remove this
                    returns: 'error',
                    execute: (ctx, [id, token]) => this.executeWebhook(ctx, id.value, token.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [id, token, content, embed]) => this.executeWebhook(ctx, id.value, token.value, content.value, embed.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL?'],
                    description: tag.withUser.description,
                    exampleCode: tag.withUser.exampleCode,
                    exampleOut: tag.withUser.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [id, token, content, embed, username, avatarURL]) => this.executeWebhook(ctx, id.value, token.value, content.value, embed.value, username.value, avatarURL.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL', 'file', 'filename?:file.txt'],
                    description: tag.withFile.description,
                    exampleCode: tag.withFile.exampleCode,
                    exampleOut: tag.withFile.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [id, token, content, embed, username, avatarURL, file, filename]) => this.executeWebhook(ctx, id.value, token.value, content.value, embed.value, username.value, avatarURL.value, file.value, filename.value)
                }
            ]
        });

        this.#converter = converter;
        this.#logger = logger;
    }

    public async executeWebhook(context: BBTagContext, webhookID: string, webhookToken: string): Promise<never>;
    public async executeWebhook(context: BBTagContext, webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void>;
    public async executeWebhook(context: BBTagContext, webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void> {
        try { //TODO Return the webhook message ID on success
            await context.discord.executeWebhook(webhookID, webhookToken, {
                username: username ||= undefined,
                avatarURL: avatar ||= undefined,
                content: content,
                embeds: this.#converter.embed(embedStr),
                file: fileStr === undefined ? undefined : [
                    {
                        name: fileName ?? 'file.txt',
                        file: fileStr.startsWith('buffer')
                            ? Buffer.from(fileStr.slice(7), 'base64')
                            : Buffer.from(fileStr)
                    }
                ]
            });
        } catch (err: unknown) {
            if (err instanceof Eris.DiscordHTTPError || err instanceof Eris.DiscordRESTError)
                throw new BBTagRuntimeError(`Error executing webhook: ${err.message}`);
            this.#logger.error('Error executing webhook', err);
            throw new BBTagRuntimeError('Error executing webhook: UNKNOWN');
        }
    }
}
