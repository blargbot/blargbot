import { guard, parse } from '@blargbot/core';
import type * as eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.send;

export interface SendPayload {
    readonly content?: string;
    readonly embeds?: eris.EmbedOptions[];
    readonly files?: eris.FileContent[];
    readonly allowedMentions?: {
        readonly everyone: boolean;
        readonly users: ReadonlySet<string>;
        readonly roles: ReadonlySet<string>;
    };
}
export type SendResult =
    | { success: true; id: string; }
    | { success: false; reason?: string; }

export interface CanPingEveryoneThunk {
    (guildId: string): Promise<boolean>;
}

export interface SendThunk {
    (channelId: string, payload: SendPayload): Promise<SendResult>;
}

export class SendSubtag extends CompiledSubtag {
    readonly #canPingEveryone: CanPingEveryoneThunk;
    readonly #send: SendThunk;
    public constructor({ canPingEveryone, send }: {
        canPingEveryone: CanPingEveryoneThunk;
        send: SendThunk;
    }) {
        super({
            name: 'send',
            category: SubtagType.MESSAGE,
            description: tag.description,
            definition: [
                {
                    parameters: ['channel', 'message', 'embed', 'fileContent', 'fileName?:file.txt'],
                    description: tag.full.description,
                    exampleCode: tag.full.exampleCode,
                    exampleOut: tag.full.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, message, embed, fileContent, fileName]) => this.send(ctx, channel.value, message.value, parse.embed(embed.value), [{ file: fileContent.value, name: fileName.value }])
                },
                {
                    parameters: ['channel', 'message', 'embed'],
                    description: tag.textAndEmbed.description,
                    exampleCode: tag.textAndEmbed.exampleCode,
                    exampleOut: tag.textAndEmbed.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, message, embed]) => this.send(ctx, channel.value, message.value, parse.embed(embed.value))
                },
                {
                    parameters: ['channel', 'content'],
                    description: tag.textOrEmbed.description,
                    exampleCode: tag.textOrEmbed.exampleCode,
                    exampleOut: tag.textOrEmbed.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, content]) => this.send(ctx, channel.value, ...resolveContent(content.value))
                }
            ]
        });
        this.#canPingEveryone = canPingEveryone;
        this.#send = send;
    }

    public async send(context: BBTagContext, channelId: string, message?: string, embeds?: eris.EmbedOptions[], files?: eris.FileContent[]): Promise<string> {
        const channel = await context.queryChannel(channelId, { noLookup: true });
        if (channel === undefined || !guard.isTextableChannel(channel))
            throw new ChannelNotFoundError(channelId);

        const nsfw = context.root.output.nsfw;
        if (!channel.nsfw && nsfw !== undefined) {
            message = nsfw;
            embeds = undefined;
            files = undefined;
        } else {
            for (const file of files ?? []) {
                if (typeof file.file === 'string' && file.file.startsWith('buffer:'))
                    file.file = Buffer.from(file.file.slice(7), 'base64');
            }
        }

        const sent = await this.#send(channel.id, {
            content: message,
            embeds: embeds,
            allowedMentions: {
                everyone: context.root.allowedMentions.everybody
                    && context.root.isCC
                    && await this.#canPingEveryone(channel.guild.id),
                roles: context.root.isCC ? context.root.allowedMentions.roles : new Set(),
                users: context.root.isCC ? context.root.allowedMentions.users : new Set()
            },
            files: files
        });

        if (sent.success) {
            context.root.ownedMessageIds.add(sent.id);
            return sent.id;
        }

        if (sent.reason === undefined)
            throw new BBTagRuntimeError('Send unsuccessful');

        throw new BBTagRuntimeError(`Failed to send: ${sent.reason}`);
    }
}

function resolveContent(content: string): [string | undefined, eris.EmbedOptions[] | undefined] {
    const embeds = parse.embed(content);
    if (embeds === undefined || 'malformed' in embeds[0])
        return [content, undefined];
    return [undefined, embeds];
}
