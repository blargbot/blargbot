import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

export class MessageEmbedsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'messageembeds',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of embeds of the invoking message.',
                    exampleCode: 'You sent an embed: "{messageembeds}"',
                    exampleOut: 'You sent an embed: "[{"title":"Hello!"}]"',
                    execute: (ctx, _, subtag) => this.getMessageEmbeds(ctx, ctx.channel.id, ctx.message.id, '', subtag)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns an array of embeds of `messageid` in the current channel',
                    exampleCode: 'Someone sent a message with embeds: "{messageembeds;1111111111111}"',
                    exampleOut: 'Someone sent a message with attachments: "[{"title":"Hello!"}]"',
                    execute: (ctx, args, subtag) => this.getMessageEmbeds(ctx, ctx.channel.id, args[0].value, '', subtag)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns an array of embeds of `messageid` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.',
                    exampleCode: 'Someone sent a message in #support with embeds: "{messageembeds;support;1111111111111}"',
                    exampleOut: 'Someone sent a message in #support with embeds: "[{"title":"Hello!"}]"',
                    execute: (ctx, args, subtag) => this.getMessageEmbeds(ctx, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async getMessageEmbeds(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr.length > 0;
        const channel = await context.getChannel(channelStr, { quiet, suppress: context.scope.suppressLookup });
        if (channel === undefined)
            return quiet ? '[]' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        let message: Message | undefined;
        try {
            message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                return this.noMessageFound(context, subtag, `${messageStr} could not be found`);
            return JSON.stringify(message.embeds);
        } catch (e: unknown) {
            return this.noMessageFound(context, subtag, `${messageStr} could not be found`);
        }

    }
}
