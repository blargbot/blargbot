import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelIsThreadSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelisthread',
            aliases: ['isthread'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the current channel is a thread channel.',
                    exampleCode: '{if;{isthread};Cool, this is a thread channel!;Boo, this is a regular text channel}',
                    exampleOut: 'Cool, this is a thread channel!',
                    returns: 'boolean',
                    execute: (ctx) => this.isThreadChannel(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a thread channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isthread;blarg podcats}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (ctx, [channel, quiet]) => this.isThreadChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async isThreadChannel(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<boolean> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }
        return guard.isThreadChannel(channel);
    }
}
