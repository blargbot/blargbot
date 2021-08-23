import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';
import { FileOptions, MessageEmbedOptions, WebhookClient } from 'discord.js';

export class WebhookSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'webhook',
            category: SubtagType.MESSAGE,
            desc: 'Please assign your webhook credentials to private variables! Do not leave them in your code.',
            definition: [
                {
                    parameters: ['id', 'token'], //! Idk why allowing users to use 2 args is even a thing, it will just error because the message is empty
                    description: 'Executes a webhook.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en}',
                    exampleOut: 'Error executing webhook: Cannot send an empty message', //TODO remove this
                    execute: async (context, args, subtag): Promise<string | void> => {
                        try {
                            await new WebhookClient({ id: args[0].value, token: args[1].value }).send({
                                content: '',
                                embeds: []
                            });
                        } catch (err: unknown) {
                            if (err instanceof Error)
                                return this.customError('Error executing webhook: ' + err.message, context, subtag);
                        }
                    }
                },
                {
                    parameters: ['id', 'token', 'content', 'embed?'],
                    description: 'Executes a webhook. If `embed` is provided it must be provided in a raw JSON format, properly escaped for BBTag. Using `{json}` is advised.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;This is the webhook content!;{json;{"title":"This is the embed title!"}}}',
                    exampleOut: '(in the webhook channel) This is the webhook content! (and with an embed with the title "This is the embed title" idk how to make this example)',
                    execute: (ctx, args, subtag) => this.executeWebhook(ctx, subtag, args[0].value, args[1].value, args[2].value, args[3].value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL?'],
                    description: 'Executes a webhook. `avatarURL` must be a valid URL.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;Some content!;;Not blargbot;{useravatar;blargbot}}',
                    exampleOut: '(in the webhook channel) Some content! (sent by "Not blargbot" with blarg\'s pfp',
                    execute: (ctx, args, subtag) => this.executeWebhook(ctx, subtag, args[0].value, args[1].value, args[2].value, args[3].value, args[4].value, args[5].value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL', 'file', 'filename?:file.txt'],
                    description: 'Executes a webhook. If file starts with buffer:, the following text will be parsed as base64 to a raw buffer.',
                    exampleCode: '{webhook;1111111111111111;t.OK-en;;;;;Hello, world!;readme.txt}',
                    exampleOut: '(in the webhook channel a file labeled readme.txt containing "Hello, world!")',
                    execute: (ctx, args, subtag) => this.executeWebhook(ctx, subtag, args[0].value, args[1].value, args[2].value, args[3].value, args[4].value, args[5].value, args[6].value, args[7].value)
                }
            ]
        });
    }

    public async executeWebhook(
        context: BBTagContext,
        subtag: SubtagCall,
        webhookID: string,
        webhookToken: string,

        content?: string,
        embedStr?: string,
        username?: string,
        avatar?: string,
        fileStr?: string,
        fileName?: string
    ): Promise<string | void> {
        let embed: MessageEmbedOptions | undefined;
        let file: FileOptions | undefined;

        if (embedStr !== undefined) {
            embed = parse.embed(embedStr);
        } else {
            embed = undefined;
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
                embeds: embed !== undefined ? [embed] : undefined,
                files: file !== undefined ? [file] : undefined
            });
        } catch (err: unknown) {
            if (err instanceof Error)
                return this.customError('Error executing webhook: ' + err.message, context, subtag);
        }
    }
}
