import Emote from '@blargbot/discord-emote';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIsNsfwSubtag } from '../channel/channelIsNsfw.js';
import type { AddReactionsFeature } from './reactionAdd.js';
import type { CanPingEveryoneFeature, SendFeature } from './send.js';

const tag = templates.subtags.output;

type Features = CanPingEveryoneFeature & SendFeature & AddReactionsFeature;
export class OutputSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async sendTagOutput(context: BBTagContext, text: string): Promise<string> {
        if (context.root.output.messageId !== undefined && text.length > 0)
            throw new BBTagRuntimeError('Cannot send multiple outputs');
        return await this.#sendOutput(context, text) ?? '';
    }

    public static async sendOutput(context: BBTagContext, text: string): Promise<string | undefined> {
        const replace = context.root.output.replace;
        if (replace !== undefined)
            text = await replace(text);

        return await context.subtags.get(OutputSubtag).#sendOutput(context, text);
    }

    async #sendOutput(context: BBTagContext, content: string): Promise<string | undefined> {
        if (context.root.silent || context.root.output.messageId !== undefined)
            return context.root.output.messageId;
        const channelId = context.root.channelId;

        const nsfw = context.root.output.nsfw;
        let { embeds, files } = context.root.output;
        if (nsfw !== undefined && !await ChannelIsNsfwSubtag.check(context, channelId)) {
            content = nsfw;
            embeds = undefined;
            files = undefined;
        }

        const response = await this.#features.sendMessage(channelId, {
            content,
            embeds,
            files,
            allowedMentions: {
                everyone: context.root.allowedMentions.everybody
                    && context.root.isCC
                    && await this.#features.canPingEveryone(context.root.guildId),
                roles: context.root.isCC ? context.root.allowedMentions.roles : new Set(),
                users: context.root.isCC ? context.root.allowedMentions.users : new Set()
            }
        });

        if (response.success) {
            context.root.output.messageId = response.id;
            context.root.ownedMessageIds.add(response.id);
            await this.#features.addMessageReactions(channelId, response.id, [...new Set(context.root.output.reactions)].map(Emote.parse));
            return response.id;
        }
        if (response.reason === undefined)
            throw new Error('Failed to send message');
        throw new Error('Failed to send message', { cause: response.reason });
    }
}
