import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { MessageService } from '../../services/MessageService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.webhook;

@Subtag.names('webhook')
@Subtag.ctorArgs('converter', 'message')
export class WebhookSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #messages: MessageService;

    public constructor(converter: BBTagValueConverter, messages: MessageService) {
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
        this.#messages = messages;
    }

    public async executeWebhook(context: BBTagContext, webhookID: string, webhookToken: string): Promise<never>;
    public async executeWebhook(context: BBTagContext, webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void>;
    public async executeWebhook(context: BBTagContext, webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void> {
        const result = await this.#messages.runWebhook(context, webhookID, webhookToken, {
            username: username ||= undefined,
            avatarUrl: avatar ||= undefined,
            content: content,
            embeds: this.#converter.embed(embedStr, { allowMalformed: true }),
            files: fileStr === undefined ? undefined : [
                {
                    name: fileName ?? 'file.txt',
                    file: fileStr.startsWith('buffer')
                        ? fileStr.slice(7)
                        : Buffer.from(fileStr).toString('base64')
                }
            ]
        });

        if (result === undefined)
            return;

        throw new BBTagRuntimeError(`Error executing webhook: ${result.error}`);
    }
}
