import type { MalformedEmbed } from '@blargbot/core';
import { guard, parse } from '@blargbot/core';
import * as eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.send;

export interface CanPingEveryoneThunk {
    (guildId: string): Promise<boolean>;
}

export class SendSubtag extends CompiledSubtag {
    readonly #canPingEveryone: CanPingEveryoneThunk;
    public constructor({ canPingEveryone }: { canPingEveryone: CanPingEveryoneThunk; }) {
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
                    execute: (ctx, [channel, message, embed, fileContent, fileName]) => this.send(ctx, channel.value, message.value, parse.embed(embed.value), { file: fileContent.value, name: fileName.value })
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
    }

    public async send(context: BBTagContext, channelId: string, message?: string, embed?: eris.EmbedOptions[] | MalformedEmbed[], file?: eris.FileContent): Promise<string> {
        const channel = await context.queryChannel(channelId, { noLookup: true });
        if (channel === undefined || !guard.isTextableChannel(channel))
            throw new ChannelNotFoundError(channelId);

        if (typeof file?.file === 'string' && file.file.startsWith('buffer:'))
            file.file = Buffer.from(file.file.slice(7), 'base64');

        try {
            const sent = await context.util.send(channel, {
                content: message,
                embeds: embed,
                nsfw: context.root.output.nsfw,
                allowedMentions: {
                    everyone: context.root.allowedMentions.everybody
                        && context.root.isCC
                        && await this.#canPingEveryone(channel.guild.id),
                    roles: context.root.isCC ? [...context.root.allowedMentions.roles] : undefined,
                    users: context.root.isCC ? [...context.root.allowedMentions.users] : undefined
                },
                file: file !== undefined ? [file] : undefined
            });

            if (sent === undefined)
                throw new BBTagRuntimeError('Send unsuccessful');

            context.root.ownedMessageIds.add(sent.id);
            return sent.id;
        } catch (err: unknown) {
            if (err instanceof BBTagRuntimeError)
                throw err;
            if (err instanceof eris.DiscordRESTError)
                throw new BBTagRuntimeError(`Failed to send: ${err.message}`);
            if (!(err instanceof Error && err.message === 'No content'))
                context.logger.error('Failed to send!', err);
            throw new BBTagRuntimeError('Failed to send: UNKNOWN');
        }

    }
}

function resolveContent(content: string): [string | undefined, eris.EmbedOptions[] | undefined] {
    const embeds = parse.embed(content);
    if (embeds === undefined || 'malformed' in embeds[0])
        return [content, undefined];
    return [undefined, embeds];
}
