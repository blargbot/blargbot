import { guard, parse } from '@blargbot/core';
import type * as eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';
import type { ApiResult } from '../types.js';
import { IsStaffSubtag } from '../user/isStaff.js';
import type { GetMessageAuthorFeature } from './messageSender.js';

const tag = templates.subtags.edit;

export interface EditMessageOptions {
    channelId: string;
    messageId: string;
    content?: string;
    embeds?: eris.EmbedOptions[];
}

export type EditMessageResult = ApiResult<null, { cause: 'messageEmpty' | 'failed'; }>

export interface EditMessageFeature {
    editMessage(options: EditMessageOptions): Promise<EditMessageResult>;
}

type Features = EditMessageFeature & GetMessageAuthorFeature;
export class EditSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'edit',
            category: SubtagType.MESSAGE,
            description: tag.description,
            definition: [
                {
                    parameters: ['messageId', 'text'],
                    description: tag.inCurrentText.description,
                    exampleCode: tag.inCurrentText.exampleCode,
                    exampleOut: tag.inCurrentText.exampleOut
                },
                {
                    parameters: ['messageId', 'embed'],
                    description: tag.inCurrentEmbed.description,
                    exampleCode: tag.inCurrentEmbed.exampleCode,
                    exampleOut: tag.inCurrentEmbed.exampleOut
                },
                {
                    parameters: ['messageId', 'text|embed'],
                    returns: 'nothing',
                    execute: (ctx, [messageId, content]) => this.edit(ctx, ctx.local.message.channel.id, messageId.value, content.value)
                },
                {
                    parameters: ['messageId', 'text', 'embed'],
                    description: tag.inCurrentFull.description,
                    exampleCode: tag.inCurrentFull.exampleCode,
                    exampleOut: tag.inCurrentFull.exampleOut
                },
                {
                    parameters: ['channel', 'messageId', 'text'],
                    description: tag.inOtherText.description,
                    exampleCode: tag.inOtherText.exampleCode,
                    exampleOut: tag.inOtherText.exampleOut
                },
                {
                    parameters: ['channel', 'messageId', 'embed'],
                    description: tag.inOtherEmbed.description,
                    exampleCode: tag.inOtherEmbed.exampleCode,
                    exampleOut: tag.inOtherEmbed.exampleOut
                },
                {
                    parameters: ['messageId|channelId', 'messageId|text', '(text|embed)|(embed)'],
                    returns: 'nothing',
                    execute: async (ctx, [chanOrMessage, messageOrText, content]) => {
                        const channelId = await ChannelIdSubtag.query(ctx, chanOrMessage.value, { noLookup: true });
                        if (channelId !== undefined)
                            //{edit;channel;msg;text|embed}
                            return await this.#editAssertedChannel(ctx, channelId, messageOrText.value, content.value);

                        //{edit;msg;text;embed}
                        return await this.edit(ctx, ctx.local.message.channel.id, chanOrMessage.value, messageOrText.value, content.value);

                    }
                },
                {
                    parameters: ['channel', 'messageID', 'text', 'embed'],
                    returns: 'nothing',
                    description: tag.inOtherFull.description,
                    exampleCode: tag.inOtherFull.exampleCode,
                    exampleOut: tag.inOtherFull.exampleOut,
                    execute: (ctx, [channelId, messageId, text, embed]) => this.edit(ctx, channelId.value, messageId.value, text.value, embed.value)
                }
            ]
        });
        this.#features = features;
    }

    public async edit(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        contentStr: string,
        embedStr?: string
    ): Promise<void> {
        if (!(context.root.ownedMessageIds.has(messageId) || await IsStaffSubtag.isStaff(context)))
            throw new BBTagRuntimeError('Author must be staff to delete unrelated messages');

        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: true })
            ?? new ChannelNotFoundError(channelStr).throw();

        await this.#edit(context, channelId, messageId, contentStr, embedStr);
    }

    async #editAssertedChannel(
        context: BBTagContext,
        channelId: string,
        messageId: string,
        contentStr: string,
        embedStr?: string): Promise<void> {
        if (!(context.root.ownedMessageIds.has(messageId) || await IsStaffSubtag.isStaff(context)))
            throw new BBTagRuntimeError('Author must be staff to delete unrelated messages');
        await this.#edit(context, channelId, messageId, contentStr, embedStr);
    }

    async #edit(
        context: BBTagContext,
        channelId: string,
        messageId: string,
        contentStr: string,
        embedStr?: string
    ): Promise<void> {

        let content: string | undefined;
        let embeds: eris.EmbedOptions[] | undefined;
        if (embedStr !== undefined) {
            embeds = parse.embed(embedStr);
            content = contentStr;
        } else {
            const parsedEmbed = parse.embed(contentStr);
            if (parsedEmbed === undefined || parsedEmbed.some(e => guard.hasProperty(e, 'malformed'))) {
                content = contentStr;
            } else {
                embeds = parsedEmbed;
            }
        }

        const authorId = await this.#features.getMessageAuthor(channelId, messageId)
            ?? new MessageNotFoundError(channelId, messageId).throw();
        if (authorId !== context.root.botId)
            throw new BBTagRuntimeError('I must be the message author');

        if (contentStr === '_delete') content = '';
        if (embedStr === '_delete') embeds = [];

        const result = await this.#features.editMessage({
            channelId,
            messageId,
            content,
            embeds
        });
        if (result.success)
            return;

        switch (result.cause) {
            case 'messageEmpty':
                throw new BBTagRuntimeError('Message cannot be empty');
            case 'failed':
                throw new BBTagRuntimeError('Edit failed', result.reason).withDisplay('');
        }
    }
}
