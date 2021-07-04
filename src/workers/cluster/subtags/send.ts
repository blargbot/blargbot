import { EmbedOptions, MessageFile } from 'eris';
import { BaseSubtag, SubtagType, BBTagContext, parse, SubtagCall, MalformedEmbed } from '../core';

export class SendSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'send',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['channel', 'message', 'embed', 'fileContent', 'fileName?:file.txt'],
                    description: 'Sends `message` and `embed` to `channel` with an attachment, and returns the message id. `channel` is either an id or channel mention. '
                        + 'If `fileContent` starts with `buffer:` then the following text will be parsed as base64 to a raw buffer.\n'
                        + '**Note:** `embed` is the JSON for an embed, don\'t put the `{embed}` subtag there, as nothing will show',
                    execute: (ctx, [channel, message, embed, fileContent, fileName], subtag) => this.send(ctx, subtag, channel.value, message.value, parse.embed(embed.value), { file: fileContent.value, name: fileName.value })
                },
                {
                    parameters: ['channel', 'message', 'embed'],
                    description: 'Sends `message` and `embed` to `channel`, and returns the message id. `channel` is either an id or channel mention.\n'
                        + '**Note:** `embed` is the JSON for an embed, don\'t put the `{embed}` subtag there, as nothing will show',
                    execute: (ctx, [channel, message, embed], subtag) => this.send(ctx, subtag, channel.value, message.value, parse.embed(embed.value))
                },
                {
                    parameters: ['channel', 'content'],
                    description: 'Sends `content` to `channel`, and returns the message id. `channel` is either an id or channel mention.\n'
                        + '**Note:** `content` is the text to send or the JSON for an embed, don\'t put the `{embed}` subtag there, as nothing will show',
                    execute: (ctx, [channel, content], subtag) => this.send(ctx, subtag, channel.value, ...resolveContent(content.value))
                }
            ]
        });
    }

    public async send(context: BBTagContext, subtag: SubtagCall, channelId: string, message?: string, embed?: EmbedOptions | MalformedEmbed, file?: MessageFile): Promise<string> {
        const channel = await context.getChannel(channelId, { quiet: true, suppress: context.scope.suppressLookup });
        if (channel === undefined)
            return this.channelNotFound(context, subtag, `Unable to read ${channelId} as a valid channel`);
        if (typeof file?.file === 'string' && file.file.startsWith('buffer:'))
            file.file = Buffer.from(file.file.slice(7), 'base64');

        const disableEveryone = !context.isCC
            || (await context.database.guilds.getSetting(channel.guild.id, 'disableeveryone')
                ?? !context.state.allowedMentions.everybody);

        try {
            const sent = await context.util.send(context.message, {
                content: message,
                embed,
                nsfw: context.state.nsfw,
                disableEveryone,
                allowedMentions: {
                    everyone: !disableEveryone,
                    roles: context.isCC ? context.state.allowedMentions.roles : false,
                    users: context.isCC ? context.state.allowedMentions.users : false
                }
            }, file);

            if (sent === undefined)
                throw new Error('Send unsuccessful');

            context.state.ownedMsgs.push(sent.id);
            return sent.id;
        } catch (err: unknown) {
            if (err instanceof Error)
                return context.addError(`Failed to send: ${err.message}`, subtag);
            context.logger.error('Failed to send!', err);
            return context.addError('Failed to send: UNKNOWN', subtag);
        }

    }
}

function resolveContent(content: string): [string | undefined, EmbedOptions | undefined] {
    const embed = parse.embed(content);
    if (embed === undefined || 'malformed' in embed && embed.malformed)
        return [content, undefined];
    return [undefined, embed];
}
