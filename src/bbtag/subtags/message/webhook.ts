import { parse } from '@blargbot/core';
import type * as eris from 'eris';

import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult } from '../types.js';

const tag = templates.subtags.webhook;

export interface ExecuteWebhookPayload {
    readonly username: string | undefined;
    readonly avatarURL: string | undefined;
    readonly content: string | undefined;
    readonly embeds: eris.EmbedOptions[] | undefined;
    readonly file: eris.FileContent[] | undefined;

}
export interface ExecuteWebhookFeature {
    executeWebhook(webhookId: string, webhookToken: string, payload: ExecuteWebhookPayload): Promise<ApiResult>;
}

type Features = ExecuteWebhookFeature
export class WebhookSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'webhook',
            category: SubtagType.MESSAGE,
            description: tag.description,
            definition: [
                {
                    parameters: ['id', 'token'], //! Idk why allowing users to use 2 args is even a thing, it will just error because the message is empty
                    description: tag.empty.description,
                    exampleCode: tag.empty.exampleCode,
                    exampleOut: tag.empty.exampleOut, //TODO remove this
                    returns: 'error',
                    execute: (_, [id, token]) => this.executeWebhook(id.value, token.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (_, [id, token, content, embed]) => this.executeWebhook(id.value, token.value, content.value, embed.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL?'],
                    description: tag.withUser.description,
                    exampleCode: tag.withUser.exampleCode,
                    exampleOut: tag.withUser.exampleOut,
                    returns: 'nothing',
                    execute: (_, [id, token, content, embed, username, avatarURL]) => this.executeWebhook(id.value, token.value, content.value, embed.value, username.value, avatarURL.value)
                },
                {
                    parameters: ['id', 'token', 'content', 'embed', 'username', 'avatarURL', 'file', 'filename?:file.txt'],
                    description: tag.withFile.description,
                    exampleCode: tag.withFile.exampleCode,
                    exampleOut: tag.withFile.exampleOut,
                    returns: 'nothing',
                    execute: (_, [id, token, content, embed, username, avatarURL, file, filename]) => this.executeWebhook(id.value, token.value, content.value, embed.value, username.value, avatarURL.value, file.value, filename.value)
                }
            ]
        });
        this.#features = features;
    }

    public async executeWebhook(webhookID: string, webhookToken: string): Promise<never>;
    public async executeWebhook(webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void>;
    public async executeWebhook(webhookID: string, webhookToken: string, content?: string, embedStr?: string, username?: string, avatar?: string, fileStr?: string, fileName?: string): Promise<void> {
        if (username === '') username = undefined;
        if (avatar === '') avatar = undefined;
        const result = await this.#features.executeWebhook(webhookID, webhookToken, {
            username: username,
            avatarURL: avatar,
            content: content,
            embeds: parse.embed(embedStr),
            file: fileStr === undefined ? undefined : [
                {
                    name: fileName ?? 'file.txt',
                    file: fileStr.startsWith('buffer:')
                        ? Buffer.from(fileStr.slice(7), 'base64')
                        : Buffer.from(fileStr)
                }
            ]
        });
        if (result.success)
            //TODO Return the webhook message ID on success
            return;
        throw new BBTagRuntimeError(`Error executing webhook: ${result.reason ?? 'UNKNOWN'}`);
    }
}
