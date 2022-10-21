import { Embed } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.messageembeds;

export class MessageEmbedsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'messageembeds',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of embeds of the invoking message.',
                    exampleCode: 'You sent an embed: "{messageembeds}"',
                    exampleOut: 'You sent an embed: "[{"title":"Hello!"}]"',
                    returns: 'embed[]',
                    execute: (ctx) => this.getMessageEmbeds(ctx, ctx.channel.id, ctx.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns an array of embeds of `messageid` in the current channel',
                    exampleCode: 'Someone sent a message with embeds: "{messageembeds;1111111111111}"',
                    exampleOut: 'Someone sent a message with attachments: "[{"title":"Hello!"}]"',
                    returns: 'embed[]',
                    execute: (ctx, [messageId]) => this.getMessageEmbeds(ctx, ctx.channel.id, messageId.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns an array of embeds of `messageid` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.',
                    exampleCode: 'Someone sent a message in #support with embeds: "{messageembeds;support;1111111111111}"',
                    exampleOut: 'Someone sent a message in #support with embeds: "[{"title":"Hello!"}]"',
                    returns: 'embed[]',
                    execute: (ctx, [channel, message, quiet]) => this.getMessageEmbeds(ctx, channel.value, message.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getMessageEmbeds(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quiet: boolean
    ): Promise<Embed[]> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '[]' : undefined);
        }

        const message = await context.getMessage(channel, messageStr);
        if (message === undefined) {
            throw new MessageNotFoundError(channel.id, messageStr)
                .withDisplay(quiet ? '[]' : undefined);
        }

        return message.embeds;

    }
}
