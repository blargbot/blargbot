import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { FileOptions, MessageEmbedOptions, WebhookClient } from 'discord.js';

export class WebhookSubtag extends Subtag {
    public constructor() {
        super({
            name: 'webhook',
            category: SubtagType.MESSAGE,
            desc: 'Please assign your webhook credentials to private variables! Do not leave them in your code.\n`embed` can be an array of embed objects.',
            definition: [
                {
                    parameters: ['id', 'token'], //! Idk why allowing users to use 2 args is even a thing, it will just error because the message is empty
                    description: 'Executes a webhook.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en}',
                    exampleOut: 'Error executing webhook: Cannot send an empty message', //TODO remove this
                    returns: 'error',
                    execute: (_, [id, token]) => this.executeWebhook(id.value, token.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed?'],
                    description: 'Executes a webhook. If `embed` is provided it must be provided in a raw JSON format, properly escaped for BBTag. Using `{json}` is advised.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;This is the webhook content!;{json;{"title":"This is the embed title!"}}}',
                    exampleOut: '(in the webhook channel) This is the webhook content! (and with an embed with the title "This is the embed title" idk how to make this example)',
                    returns: 'nothing',
                    execute: (_, [id, token, content, embed]) => this.executeWebhook(id.value, token.value, content.value, embed.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL?'],
                    description: 'Executes a webhook. `avatarURL` must be a valid URL.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;Some content!;;Not blargbot;{useravatar;blargbot}}',
                    exampleOut: '(in the webhook channel) Some content! (sent by "Not blargbot" with blarg\'s pfp',
                    returns: 'nothing',
                    execute: (_, [id, token, content, embed, username, avatarURL]) => this.executeWebhook(id.value, token.value, content.value, embed.value, username.value, avatarURL.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL', 'file', 'filename?:file.txt'],
                    description: 'Executes a webhook. If file starts with buffer:, the following text will be parsed as base64 to a raw buffer.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;;;;;Hello, world!;readme.txt}',
                    exampleOut: '(in the webhook channel a file labeled readme.txt containing "Hello, world!")',
                    returns: 'nothing',
                    execute: (_, [id, token, content, embed, username, avatarURL, file, filename]) => this.executeWebhook(id.value, token.value, content.value, embed.value, username.value, avatarURL.value, file.value, filename.value)
                }
            ]
        });
    }

    public async executeWebhook(webhookID: string, webhookToken: string): Promise<never>;
    public async executeWebhook(webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void>;
    public async executeWebhook(webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void> {
        let embeds: MessageEmbedOptions[] | undefined;
        let file: FileOptions | undefined;

        if (embedStr !== undefined) {
            embeds = parse.embed(embedStr);
        }
        if (fileStr !== undefined) {
            if (fileName === undefined) fileName = 'file.txt';

            if (fileStr.startsWith('buffer:')) {
                file = { attachment: Buffer.from(fileStr.substring(7), 'base64'), name: fileName };
            } else {
                file = { attachment: Buffer.from(fileStr), name: fileName };
            }
        } else {
            file = undefined;
        }

        try { //TODO Return the webhook message ID on success
            await new WebhookClient({ id: webhookID, token: webhookToken }).send({
                username: username,
                avatarURL: avatar,
                content: content,
                embeds,
                files: file !== undefined ? [file] : undefined
            });
        } catch (err: unknown) {
            if (err instanceof Error)
                throw new BBTagRuntimeError('Error executing webhook: ' + err.message);
            throw err;
        }
    }
}
