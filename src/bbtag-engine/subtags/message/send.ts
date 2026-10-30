import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { Embed, FileContent } from '../../types.js';
import { convertToEmbed } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';
import { ChannelIsNsfwSubtag } from '../channel/channelIsNsfw.js';
import { ChannelIsTextSubtag } from '../channel/channelIsText.js';
import type { ApiResult } from '../types.js';

const tag = templates.subtags.send;

export interface SendPayload {
    readonly content?: string;
    readonly embeds?: Embed[];
    readonly files?: FileContent[];
    readonly allowedMentions?: {
        readonly everyone: boolean;
        readonly users: ReadonlySet<string>;
        readonly roles: ReadonlySet<string>;
    };
}
export type SendResult = ApiResult<{ id: string; }>;

export interface CanPingEveryoneFeature {
    canPingEveryone(guildId: string): Promise<boolean>;
}

export interface SendFeature {
    sendMessage(channelId: string, payload: SendPayload): Promise<SendResult>;
}

type Features = CanPingEveryoneFeature & SendFeature
export class SendSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
                    execute: (ctx, [channel, message, embed, fileContent, fileName]) => this.send(ctx, channel.value, message.value, convertToEmbed(embed.value), [{
                        file: fileContent.value.startsWith('buffer:')
                            ? Buffer.from(fileContent.value.slice(7), 'base64')
                            : Buffer.from(fileContent.value),
                        name: fileName.value
                    }])
                },
                {
                    parameters: ['channel', 'message', 'embed'],
                    description: tag.textAndEmbed.description,
                    exampleCode: tag.textAndEmbed.exampleCode,
                    exampleOut: tag.textAndEmbed.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, message, embed]) => this.send(ctx, channel.value, message.value, convertToEmbed(embed.value))
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
        this.#features = features;
    }

    public async send(context: BBTagContext, channelStr: string, message?: string, embeds?: Embed[], files?: FileContent[]): Promise<string> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: true })
            ?? new ChannelNotFoundError(channelStr).throw();
        if (!await ChannelIsTextSubtag.check(context, channelId))
            throw new ChannelNotFoundError(channelId);

        const nsfw = context.root.output.nsfw;
        if (nsfw !== undefined && !await ChannelIsNsfwSubtag.check(context, channelId)) {
            message = nsfw;
            embeds = undefined;
            files = undefined;
        }

        const sent = await this.#features.sendMessage(channelId, {
            content: message,
            embeds: embeds,
            allowedMentions: {
                everyone: context.root.allowedMentions.everybody
                    && context.root.isCC
                    && await this.#features.canPingEveryone(context.root.guildId),
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

function resolveContent(content: string): [string | undefined, Embed[] | undefined] {
    const embeds = convertToEmbed(content, false);
    if (embeds === undefined)
        return [content, undefined];
    return [undefined, embeds];
}
