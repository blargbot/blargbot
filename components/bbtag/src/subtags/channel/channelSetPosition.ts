import * as Eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.channelSetPosition;

@Subtag.id('channelSetPosition', 'channelSetPos')
@Subtag.factory(Subtag.converter())
export class ChannelSetPositionSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'position'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [channel, position]) => this.setChannelPosition(ctx, channel.value, position.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public async setChannelPosition(context: BBTagContext, channelStr: string, posStr: string): Promise<void> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');//TODO No channel found error

        if (!context.hasPermission(channel, 'manageChannels'))
            throw new BBTagRuntimeError('Author cannot move this channel');

        const pos = this.#converter.int(posStr);
        if (pos === undefined)
            throw new NotANumberError(posStr);

        //TODO maybe check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?

        try {
            await channel.editPosition(pos);
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to move channel: no perms', err.message);
        }
    }
}
