import { parse } from '@blargbot/core/utils';
import { ApiError, DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class SlowmodeSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'slowmode',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: 'Removes slowmode for the current channel.',
                    exampleCode: '{slowmode}',
                    exampleOut: '(slowmode is now disabled)',
                    returns: 'nothing',
                    execute: (ctx) => this.setSlowmode(ctx, ctx.channel.id, '0')
                },
                {
                    parameters: ['channel|time'],
                    description: 'Removes slowmode from `channel`. If `channel` cannot be resolved directly, it will enable slowmode for the current channel and set the cooldown to `time`',
                    exampleCode: '{slowmode;testing-grounds}\n{slowmode;10}',
                    exampleOut: '(disabled slowmode in testing-grounds)\n(set slow mode to 10 seconds)',
                    returns: 'nothing',
                    execute: (ctx, [channel]) => this.setSlowmode(ctx, channel.value, '')
                },
                {
                    parameters: ['channel', 'time:0'],
                    description: 'Enables slowmode in `channel` and set the cooldown to `time`. If `channel` cannot be resolved directly, it will remove slowmode in the current channel (unless `channel` is a valid number, then the slowmode cooldown will be set to `channel` in the current channel).', //TODO thank backwards compatibility
                    exampleCode: '{slowmode;testing-grounds;10}\n{slowmode;50;doesn\'t matter}',
                    exampleOut: '(set slowmode cooldown to 10 seconds in testing-grounds)\n(set slowmode to 50s in the current channel)',
                    returns: 'nothing',
                    execute: (ctx, [channel, time]) => this.setSlowmode(ctx, channel.value, time.value)
                }
            ]
        });
    }

    public async setSlowmode(
        context: BBTagContext,
        channelStr: string,
        timeStr: string
    ): Promise<void> {
        let time = parse.int(timeStr);
        let channel;
        const lookupChannel = await context.queryChannel(channelStr, { noLookup: true });//TODO yikes
        if (lookupChannel !== undefined)
            channel = lookupChannel;
        else {
            channel = context.channel;
            time = parse.int(channelStr);
        }

        if (isNaN(time))
            time = 0;

        time = Math.min(time, 21600);

        try {
            await channel.edit({ rateLimitPerUser: time }, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            if (err.code === ApiError.MISSING_PERMISSIONS)
                throw new BBTagRuntimeError('Missing required permissions');

            throw new BBTagRuntimeError(`Failed to edit channel: ${err.message}`);
        }
    }
}
