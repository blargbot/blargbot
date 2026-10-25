import { Emote } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIsNsfwSubtag } from '../channel/channelIsNsfw.js';
import type { AddReactionsThunk } from './reactionAdd.js';
import type { CanPingEveryoneThunk, SendThunk } from './send.js';

const tag = templates.subtags.output;

export class OutputSubtag extends CompiledSubtag {
    readonly #canPingEveryone: CanPingEveryoneThunk;
    readonly #send: SendThunk;
    readonly #addReactions: AddReactionsThunk;
    public constructor({ canPingEveryone, send, addReactions }: {
        canPingEveryone: CanPingEveryoneThunk;
        send: SendThunk;
        addReactions: AddReactionsThunk;
    }) {
        super({
            name: 'output',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['text?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx, [text]) => this.sendTagOutput(ctx, text.value)
                }
            ]
        });
        this.#canPingEveryone = canPingEveryone;
        this.#send = send;
        this.#addReactions = addReactions;
    }

    public async sendTagOutput(context: BBTagContext, text: string): Promise<string> {
        if (context.root.output.messageId !== undefined && text.length > 0)
            throw new BBTagRuntimeError('Cannot send multiple outputs');
        return await this.#sendOutput(context, text) ?? '';
    }

    public static async sendOutput(context: BBTagContext, text: string): Promise<string | undefined> {
        const replace = context.root.output.replace;
        if (replace !== undefined)
            text = text.replace(replace.regex, replace.with);

        return await context.engine.getSubtag(OutputSubtag).#sendOutput(context, text);
    }

    async #sendOutput(context: BBTagContext, content: string): Promise<string | undefined> {
        if (context.root.silent || context.root.output.messageId !== undefined)
            return context.root.output.messageId;
        const channel = context.root.message.channel;

        const nsfw = context.root.output.nsfw;
        let { embeds, files } = context.root.output;
        if (nsfw !== undefined && !await ChannelIsNsfwSubtag.check(context, channel.id)) {
            content = nsfw;
            embeds = undefined;
            files = undefined;
        }

        const response = await this.#send(channel.id, {
            content,
            embeds,
            files,
            allowedMentions: {
                everyone: context.root.allowedMentions.everybody
                    && context.root.isCC
                    && await this.#canPingEveryone(channel.guild.id),
                roles: context.root.isCC ? context.root.allowedMentions.roles : new Set(),
                users: context.root.isCC ? context.root.allowedMentions.users : new Set()
            }
        });

        if (response.success) {
            context.root.output.messageId = response.id;
            context.root.ownedMessageIds.add(response.id);
            await this.#addReactions(channel.id, response.id, [...new Set(context.root.output.reactions)].map(Emote.parse));
            return response.id;
        }
        if (response.reason === undefined)
            throw new Error('Failed to send message');
        throw new Error('Failed to send message', { cause: response.reason });
    }
}
