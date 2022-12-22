import type { MalformedEmbed } from '@blargbot/core/types.js';
import { guard, parse } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { BBTagRuntimeError, ChannelNotFoundError } from '@bbtag/engine';

export class SendSubtag extends Subtag {
    public constructor() {
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
    }

    public async send(context: BBTagContext, channelId: string, message?: string, embed?: Eris.EmbedOptions[] | MalformedEmbed[], file?: Eris.FileContent): Promise<string> {
        const channel = await context.queryChannel(channelId, { noLookup: true });
        if (channel === undefined || !guard.isTextableChannel(channel))
            throw new ChannelNotFoundError(channelId);

        if (typeof file?.file === 'string' && file.file.startsWith('buffer:'))
            file.file = Buffer.from(file.file.slice(7), 'base64');

        const disableEveryone = !context.isCC
            || (await context.database.guilds.getSetting(channel.guild.id, 'disableeveryone')
                ?? !context.data.allowedMentions.everybody);

        try {
            const sent = await context.util.send(channel, {
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
                context.logger.error('Failed to send!', err);
            throw new BBTagRuntimeError('Failed to send: UNKNOWN');
        }

    }
}

function resolveContent(content: string): [string | undefined, Eris.EmbedOptions[] | undefined] {
    const embeds = parse.embed(content);
    if (embeds === undefined || 'malformed' in embeds[0])
        return [content, undefined];
    return [undefined, embeds];
}
