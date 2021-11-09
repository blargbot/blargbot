import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError } from '@cluster/bbtag/errors';
import { guard, parse, SubtagType } from '@cluster/utils';
import { MalformedEmbed } from '@core/types';
import { FileOptions, MessageEmbedOptions } from 'discord.js';

export class SendSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'send',
            category: SubtagType.MESSAGE,
            desc: 'If `embed` is an array, multiple embeds will be added to the message payload.',
            definition: [
                {
                    parameters: ['channel', 'message', 'embed', 'fileContent', 'fileName?:file.txt'],
                    description: 'Sends `message` and `embed` to `channel` with an attachment, and returns the message id. `channel` is either an id or channel mention. '
                        + 'If `fileContent` starts with `buffer:` then the following text will be parsed as base64 to a raw buffer.\n'
                        + '**Note:** `embed` is the JSON for an embed, don\'t put the `{embed}` subtag there, as nothing will show',
                    execute: (ctx, [channel, message, embed, fileContent, fileName]) => this.send(ctx, channel.value, message.value, parse.embed(embed.value), { attachment: fileContent.value, name: fileName.value })
                },
                {
                    parameters: ['channel', 'message', 'embed'],
                    description: 'Sends `message` and `embed` to `channel`, and returns the message id. `channel` is either an id or channel mention.\n'
                        + '**Note:** `embed` is the JSON for an embed, don\'t put the `{embed}` subtag there, as nothing will show',
                    execute: (ctx, [channel, message, embed]) => this.send(ctx, channel.value, message.value, parse.embed(embed.value))
                },
                {
                    parameters: ['channel', 'content'],
                    description: 'Sends `content` to `channel`, and returns the message id. `channel` is either an id or channel mention.\n'
                        + '**Note:** `content` is the text to send or the JSON for an embed, don\'t put the `{embed}` subtag there, as nothing will show',
                    execute: (ctx, [channel, content]) => this.send(ctx, channel.value, ...resolveContent(content.value))
                }
            ]
        });
    }

    public async send(context: BBTagContext, channelId: string, message?: string, embed?: MessageEmbedOptions[] | MalformedEmbed[], file?: FileOptions): Promise<string> {
        const channel = await context.queryChannel(channelId, { noLookup: true });
        if (channel === undefined || !guard.isTextableChannel(channel))
            throw new ChannelNotFoundError(channelId);

        if (typeof file?.attachment === 'string' && file.attachment.startsWith('buffer:'))
            file.attachment = Buffer.from(file.attachment.slice(7), 'base64');

        const disableEveryone = !context.isCC
            || (await context.database.guilds.getSetting(channel.guild.id, 'disableeveryone')
                ?? !context.state.allowedMentions.everybody);

        try {
            const sent = await context.util.send(channel, {
                content: message,
                embeds: embed !== undefined ? embed : undefined,
                nsfw: context.state.nsfw,
                allowedMentions: {
                    parse: disableEveryone ? [] : ['everyone'],
                    roles: context.isCC ? context.state.allowedMentions.roles : undefined,
                    users: context.isCC ? context.state.allowedMentions.users : undefined
                },
                files: file !== undefined ? [file] : undefined
            });

            if (sent === undefined)
                throw new Error('Send unsuccessful');

            context.state.ownedMsgs.push(sent.id);
            return sent.id;
        } catch (err: unknown) {
            if (err instanceof Error)
                throw new BBTagRuntimeError(`Failed to send: ${err.message}`);
            context.logger.error('Failed to send!', err);
            throw new BBTagRuntimeError('Failed to send: UNKNOWN');
        }

    }
}

function resolveContent(content: string): [string | undefined, MessageEmbedOptions[] | undefined] {
    const embeds = parse.embed(content);
    if (embeds === undefined || 'malformed' in embeds[0])
        return [content, undefined];
    return [undefined, embeds];
}
