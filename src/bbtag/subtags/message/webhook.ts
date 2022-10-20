import { parse } from '@blargbot/core/utils';
import { DiscordHTTPError, DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class WebhookSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'webhook',
            category: SubtagType.MESSAGE,
            description: 'Please assign your webhook credentials to private variables! Do not leave them in your code.\n`embed` can be an array of embed objects.',
            definition: [
                {
                    parameters: ['id', 'token'], //! Idk why allowing users to use 2 args is even a thing, it will just error because the message is empty
                    description: 'Executes a webhook.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en}',
                    exampleOut: 'Error executing webhook: Cannot send an empty message', //TODO remove this
                    returns: 'error',
                    execute: (ctx, [id, token]) => this.executeWebhook(ctx, id.value, token.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed?'],
                    description: 'Executes a webhook. If `embed` is provided it must be provided in a raw JSON format, properly escaped for BBTag. Using `{json}` is advised.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;This is the webhook content!;{json;{"title":"This is the embed title!"}}}',
                    exampleOut: '(in the webhook channel) This is the webhook content! (and with an embed with the title "This is the embed title" idk how to make this example)',
                    returns: 'nothing',
                    execute: (ctx, [id, token, content, embed]) => this.executeWebhook(ctx, id.value, token.value, content.value, embed.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL?'],
                    description: 'Executes a webhook. `avatarURL` must be a valid URL.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;Some content!;;Not blargbot;{useravatar;blargbot}}',
                    exampleOut: '(in the webhook channel) Some content! (sent by "Not blargbot" with blarg\'s pfp',
                    returns: 'nothing',
                    execute: (ctx, [id, token, content, embed, username, avatarURL]) => this.executeWebhook(ctx, id.value, token.value, content.value, embed.value, username.value, avatarURL.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL', 'file', 'filename?:file.txt'],
                    description: 'Executes a webhook. If file starts with buffer:, the following text will be parsed as base64 to a raw buffer.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;;;;;Hello, world!;readme.txt}',
                    exampleOut: '(in the webhook channel a file labeled readme.txt containing "Hello, world!")',
                    returns: 'nothing',
                    execute: (ctx, [id, token, content, embed, username, avatarURL, file, filename]) => this.executeWebhook(ctx, id.value, token.value, content.value, embed.value, username.value, avatarURL.value, file.value, filename.value)
                }
            ]
        });
    }

    public async executeWebhook(context: BBTagContext, webhookID: string, webhookToken: string): Promise<never>;
    public async executeWebhook(context: BBTagContext, webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void>;
    public async executeWebhook(context: BBTagContext, webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void> {
        try { //TODO Return the webhook message ID on success
            await context.discord.executeWebhook(webhookID, webhookToken, {
                username: username ||= undefined,
                avatarURL: avatar ||= undefined,
                content: content,
                embeds: parse.embed(embedStr),
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
            if (err instanceof DiscordHTTPError || err instanceof DiscordRESTError)
                throw new BBTagRuntimeError(`Error executing webhook: ${  err.message}`);
            context.logger.error('Error executing webhook', err);
            throw new BBTagRuntimeError('Error executing webhook: UNKNOWN');
        }
    }
}
